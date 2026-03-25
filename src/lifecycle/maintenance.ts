/**
 * Praxis Lifecycle Engine — Maintenance
 *
 * Handles ongoing maintenance events:
 * - Vulnerability detection → expectation creation
 * - Dependency updates
 * - Customer-reported issues
 * - Incident fast-path
 */

import type { TriggerAction, LifecycleExpectation } from './types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** npm audit vulnerability data shape */
interface NpmAuditVulnData {
  via?: Array<{ url?: string; title?: string }>;
  severity?: string;
  fixAvailable?: { version?: string };
}

/** npm outdated package data shape */
interface NpmOutdatedPkgData {
  current?: string;
  latest?: string;
  type?: string;
}

/** A security vulnerability detected in a dependency, including CVE details and severity. */
export interface Vulnerability {
  /** CVE ID or advisory ID */
  id: string;
  /** Affected package */
  package: string;
  /** Severity */
  severity: 'critical' | 'high' | 'moderate' | 'low';
  /** Description */
  description: string;
  /** Fixed in version */
  fixedIn?: string;
  /** CVSS score */
  cvss?: number;
}

/** An available update for a dependency, indicating the current and latest versions and whether the update is breaking. */
export interface DependencyUpdate {
  package: string;
  currentVersion: string;
  latestVersion: string;
  updateType: 'major' | 'minor' | 'patch';
  breaking: boolean;
}

/** A customer-reported issue including severity, reproduction steps, and reporter information. */
export interface CustomerReport {
  id: string;
  reporter: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reproSteps?: string[];
}

/** A production incident requiring a hotfix, including severity level and affected services. */
export interface Incident {
  id: string;
  title: string;
  severity: 'sev0' | 'sev1' | 'sev2' | 'sev3';
  description: string;
  affectedServices: string[];
}

// ─── Conversion Helpers ─────────────────────────────────────────────────────

/**
 * Convert a vulnerability to an expectation.
 */
export function vulnerabilityToExpectation(vuln: Vulnerability): LifecycleExpectation {
  const priority = vuln.severity === 'critical' ? 'critical'
    : vuln.severity === 'high' ? 'high'
    : vuln.severity === 'moderate' ? 'medium'
    : 'low';

  return {
    id: `vuln-${vuln.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    type: 'security',
    title: `Fix vulnerability: ${vuln.id} in ${vuln.package}`,
    description: vuln.description,
    priority,
    acceptance: [
      `${vuln.package} updated to ${vuln.fixedIn ?? 'patched version'}`,
      `No ${vuln.severity} vulnerabilities in ${vuln.package}`,
    ],
    labels: ['security', 'vulnerability', vuln.severity],
    meta: { cve: vuln.id, cvss: vuln.cvss, package: vuln.package },
  };
}

/**
 * Convert a customer report to an expectation.
 */
export function customerReportToExpectation(report: CustomerReport): LifecycleExpectation {
  return {
    id: `customer-${report.id}`,
    type: 'fix',
    title: report.title,
    description: report.description,
    priority: report.severity === 'critical' ? 'critical' : report.severity === 'high' ? 'high' : 'medium',
    acceptance: report.reproSteps
      ? [`Issue no longer reproducible with steps: ${report.reproSteps.join(' → ')}`]
      : ['Customer-reported issue is resolved'],
    labels: ['customer-reported', report.severity],
    meta: { reporter: report.reporter, reportId: report.id },
  };
}

/**
 * Convert an incident to a hotfix expectation.
 */
export function incidentToExpectation(incident: Incident): LifecycleExpectation {
  return {
    id: `incident-${incident.id}`,
    type: 'fix',
    title: `HOTFIX: ${incident.title}`,
    description: incident.description,
    priority: 'critical',
    acceptance: [
      ...incident.affectedServices.map(s => `${s} is operational`),
      'Root cause identified and fixed',
    ],
    labels: ['incident', 'hotfix', incident.severity],
    meta: { incidentId: incident.id, severity: incident.severity },
  };
}

// ─── Maintenance Triggers ───────────────────────────────────────────────────

/** Built-in trigger actions for the maintenance lifecycle phase (vulnerability scanning, dependency updates, and incident response). */
export const maintenance = {
  /**
   * Scan for vulnerabilities and create expectations.
   */
  auditDependencies(): TriggerAction {
    return {
      id: 'maintenance.audit',
      description: 'Audit dependencies for vulnerabilities',
      execute: async (_event, ctx) => {
        try {
          const { execSync } = await import('node:child_process');
          const output = execSync('npm audit --json 2>/dev/null || true', {
            encoding: 'utf-8',
            timeout: 30_000,
          });

          let vulns: Vulnerability[] = [];
          try {
            const audit = JSON.parse(output) as { vulnerabilities?: Record<string, NpmAuditVulnData> };
            if (audit.vulnerabilities) {
              vulns = Object.entries(audit.vulnerabilities).map(([pkg, data]) => ({
                id: data.via?.[0]?.url ?? `npm-${pkg}`,
                package: pkg,
                severity: (data.severity as Vulnerability['severity']) ?? 'moderate',
                description: data.via?.[0]?.title ?? `Vulnerability in ${pkg}`,
                fixedIn: data.fixAvailable?.version,
              }));
            }
          } catch { /* not JSON audit output */ }

          // Convert to expectations
          for (const vuln of vulns.filter(v => v.severity === 'critical' || v.severity === 'high')) {
            const exp = vulnerabilityToExpectation(vuln);
            ctx.addExpectation(exp);
          }

          return {
            success: true,
            message: `Found ${vulns.length} vulnerabilities (${vulns.filter(v => v.severity === 'critical' || v.severity === 'high').length} high/critical)`,
            data: { total: vulns.length, vulnerabilities: vulns },
          };
        } catch (err) {
          return { success: false, message: 'Audit failed', error: (err as Error).message };
        }
      },
    };
  },

  /**
   * Check for outdated dependencies.
   */
  checkOutdated(): TriggerAction {
    return {
      id: 'maintenance.outdated',
      description: 'Check for outdated dependencies',
      execute: async () => {
        try {
          const { execSync } = await import('node:child_process');
          const output = execSync('npm outdated --json 2>/dev/null || true', {
            encoding: 'utf-8',
            timeout: 30_000,
          });

          let updates: DependencyUpdate[] = [];
          try {
            const outdated = JSON.parse(output) as Record<string, NpmOutdatedPkgData>;
            updates = Object.entries(outdated).map(([pkg, data]) => ({
              package: pkg,
              currentVersion: data.current ?? 'unknown',
              latestVersion: data.latest ?? 'unknown',
              updateType: (data.type as DependencyUpdate['updateType']) ?? 'patch',
              breaking: data.type === 'major',
            }));
          } catch { /* not JSON */ }

          return {
            success: true,
            message: `${updates.length} outdated packages`,
            data: { updates },
          };
        } catch (err) {
          return { success: false, message: 'Outdated check failed', error: (err as Error).message };
        }
      },
    };
  },

  /**
   * Process a customer report into the expectation pipeline.
   */
  processCustomerReport(): TriggerAction {
    return {
      id: 'maintenance.customer-report',
      description: 'Convert customer report to expectation',
      execute: async (event, ctx) => {
        const report = event.data.report as CustomerReport | undefined;
        if (!report) {
          return { success: false, message: 'No report in event data', error: 'Missing report' };
        }

        const exp = customerReportToExpectation(report);
        ctx.addExpectation(exp);
        ctx.emit('lifecycle/design/expectation.submitted', {
          expectationId: exp.id,
          source: 'customer-report',
        });

        return {
          success: true,
          message: `Created expectation ${exp.id} from customer report`,
          data: { expectationId: exp.id },
        };
      },
    };
  },

  /**
   * Process an incident into the hotfix fast-path.
   */
  processIncident(): TriggerAction {
    return {
      id: 'maintenance.incident',
      description: 'Convert incident to hotfix expectation',
      execute: async (event, ctx) => {
        const incident = event.data.incident as Incident | undefined;
        if (!incident) {
          return { success: false, message: 'No incident in event data', error: 'Missing incident' };
        }

        const exp = incidentToExpectation(incident);
        ctx.addExpectation(exp);

        // Incidents go directly to high-priority classification
        ctx.emit('lifecycle/design/expectation.classified', {
          expectationId: exp.id,
          type: 'fix',
          priority: 'critical',
          source: 'incident',
          fastPath: true,
        });

        return {
          success: true,
          message: `HOTFIX expectation ${exp.id} created from incident ${incident.id}`,
          data: { expectationId: exp.id, severity: incident.severity },
        };
      },
    };
  },
};
