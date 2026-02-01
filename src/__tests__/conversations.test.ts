/**
 * Tests for praxis-conversations subsystem
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  captureConversation,
  loadConversation,
  redactConversation,
  redactText,
  normalizeConversation,
  classifyConversation,
  generateCandidate,
  applyGates,
  candidatePassed,
  emitToFS,
  type Conversation,
} from '../conversations/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const fixturesDir = path.join(projectRoot, 'test/fixtures/conversations');

describe('Conversations Subsystem', () => {
  describe('Capture', () => {
    it('should capture a conversation from input', () => {
      const conversation = captureConversation({
        turns: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        metadata: {
          source: 'test',
        },
      });

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.turns).toHaveLength(2);
      expect(conversation.metadata.source).toBe('test');
      expect(conversation.redacted).toBe(false);
      expect(conversation.normalized).toBe(false);
    });

    it('should load conversation from JSON', async () => {
      const bugReportPath = path.join(fixturesDir, 'bug-report.json');
      const content = await fs.readFile(bugReportPath, 'utf-8');
      const conversation = loadConversation(content);

      expect(conversation.id).toBe('test-conversation-1');
      expect(conversation.turns).toHaveLength(3);
      expect(conversation.metadata.source).toBe('github-copilot');
    });
  });

  describe('Redaction', () => {
    it('should redact email addresses', () => {
      const text = 'Contact me at john.doe@example.com for more info';
      const redacted = redactText(text);
      
      expect(redacted).toContain('[EMAIL_REDACTED]');
      expect(redacted).not.toContain('john.doe@example.com');
    });

    it('should redact phone numbers', () => {
      const text = 'Call me at 555-123-4567';
      const redacted = redactText(text);
      
      expect(redacted).toContain('[PHONE_REDACTED]');
      expect(redacted).not.toContain('555-123-4567');
    });

    it('should redact IP addresses', () => {
      const text = 'Server IP is 192.168.1.100';
      const redacted = redactText(text);
      
      expect(redacted).toContain('[IP_REDACTED]');
      expect(redacted).not.toContain('192.168.1.100');
    });

    it('should redact conversation content', async () => {
      const bugReportPath = path.join(fixturesDir, 'bug-report.json');
      const content = await fs.readFile(bugReportPath, 'utf-8');
      const conversation = loadConversation(content);
      
      const redacted = redactConversation(conversation);
      
      expect(redacted.redacted).toBe(true);
      expect(redacted.turns[0].content).toContain('[EMAIL_REDACTED]');
      expect(redacted.turns[0].content).not.toContain('test@example.com');
    });
  });

  describe('Normalization', () => {
    it('should normalize whitespace', () => {
      const conversation = captureConversation({
        turns: [
          { role: 'user', content: 'Hello\r\n\r\n\r\nWorld\t\t\tTest' },
        ],
        metadata: {},
      });
      
      const normalized = normalizeConversation(conversation);
      
      expect(normalized.normalized).toBe(true);
      expect(normalized.turns[0].content).not.toContain('\r');
      expect(normalized.turns[0].content).not.toContain('\t');
    });

    it('should normalize code blocks', () => {
      const conversation = captureConversation({
        turns: [
          { role: 'user', content: '```JAVASCRIPT\nconst x = 1;\n```' },
        ],
        metadata: {},
      });
      
      const normalized = normalizeConversation(conversation);
      
      expect(normalized.turns[0].content).toContain('```javascript');
    });
  });

  describe('Classification', () => {
    it('should classify bug report correctly', async () => {
      const bugReportPath = path.join(fixturesDir, 'bug-report.json');
      const content = await fs.readFile(bugReportPath, 'utf-8');
      let conversation = loadConversation(content);
      
      conversation = classifyConversation(conversation);
      
      expect(conversation.classified).toBe(true);
      expect(conversation.classification?.category).toBe('bug-report');
      expect(conversation.classification?.confidence).toBeGreaterThan(0);
    });

    it('should classify feature request correctly', async () => {
      const featurePath = path.join(fixturesDir, 'feature-request.json');
      const content = await fs.readFile(featurePath, 'utf-8');
      let conversation = loadConversation(content);
      
      conversation = classifyConversation(conversation);
      
      expect(conversation.classified).toBe(true);
      expect(conversation.classification?.category).toBe('feature-request');
    });

    it('should classify question correctly', async () => {
      const questionPath = path.join(fixturesDir, 'question.json');
      const content = await fs.readFile(questionPath, 'utf-8');
      let conversation = loadConversation(content);
      
      conversation = classifyConversation(conversation);
      
      expect(conversation.classified).toBe(true);
      expect(conversation.classification?.category).toBe('question');
    });
  });

  describe('Candidate Generation', () => {
    it('should generate candidate from classified conversation', async () => {
      const bugReportPath = path.join(fixturesDir, 'bug-report.json');
      const content = await fs.readFile(bugReportPath, 'utf-8');
      let conversation = loadConversation(content);
      
      conversation = classifyConversation(conversation);
      const candidate = generateCandidate(conversation);
      
      expect(candidate).toBeDefined();
      expect(candidate?.id).toBeDefined();
      expect(candidate?.conversationId).toBe(conversation.id);
      expect(candidate?.title).toContain('Bug Report');
      expect(candidate?.body).toContain('Conversation Summary');
      expect(candidate?.metadata.priority).toBe('high');
    });

    it('should throw error if conversation not classified', () => {
      const conversation = captureConversation({
        turns: [{ role: 'user', content: 'test' }],
        metadata: {},
      });
      
      expect(() => generateCandidate(conversation)).toThrow();
    });
  });

  describe('Gating', () => {
    it('should pass gates for valid candidate', async () => {
      const bugReportPath = path.join(fixturesDir, 'bug-report.json');
      const content = await fs.readFile(bugReportPath, 'utf-8');
      let conversation = loadConversation(content);
      
      conversation = classifyConversation(conversation);
      const candidate = generateCandidate(conversation);
      
      if (candidate) {
        const gated = applyGates(candidate);
        
        expect(gated.gateStatus).toBeDefined();
        expect(gated.gateStatus?.gates).toHaveLength(4);
        expect(candidatePassed(gated)).toBe(true);
      }
    });

    it('should fail gate for short content', () => {
      const conversation = captureConversation({
        turns: [{ role: 'user', content: 'Hi' }],
        metadata: {},
      });
      
      conversation = classifyConversation(conversation);
      const candidate = generateCandidate(conversation);
      
      if (candidate) {
        const gated = applyGates(candidate);
        const passed = candidatePassed(gated);
        
        expect(passed).toBe(false);
        expect(gated.gateStatus?.reason).toContain('minimum-length');
      }
    });
  });

  describe('Emitters', () => {
    describe('FS Emitter', () => {
      it('should emit candidate to filesystem', async () => {
        const tmpDir = path.join(projectRoot, 'test/.tmp/emit-test');
        
        const bugReportPath = path.join(fixturesDir, 'bug-report.json');
        const content = await fs.readFile(bugReportPath, 'utf-8');
        let conversation = loadConversation(content);
        
        conversation = classifyConversation(conversation);
        const candidate = generateCandidate(conversation);
        
        if (candidate) {
          const gated = applyGates(candidate);
          
          const result = await emitToFS(gated, {
            outputDir: tmpDir,
          });
          
          expect(result.emitted).toBe(true);
          expect(result.emissionResult?.success).toBe(true);
          
          // Verify file was created
          const files = await fs.readdir(tmpDir);
          expect(files.length).toBeGreaterThan(0);
          
          // Cleanup
          await fs.rm(tmpDir, { recursive: true, force: true });
        }
      });

      it('should support dry run mode', async () => {
        const conversation = captureConversation({
          turns: [{ role: 'user', content: 'Test message for dry run mode' }],
          metadata: {},
        });
        
        conversation = classifyConversation(conversation);
        const candidate = generateCandidate(conversation);
        
        if (candidate) {
          const gated = applyGates(candidate);
          
          const result = await emitToFS(gated, {
            outputDir: '/tmp/nonexistent',
            dryRun: true,
          });
          
          expect(result.emitted).toBe(true);
          expect(result.emissionResult?.success).toBe(true);
          expect(result.emissionResult?.externalId).toContain('fs://');
        }
      });
    });
  });

  describe('Full Pipeline', () => {
    it('should process conversation through full pipeline', async () => {
      const bugReportPath = path.join(fixturesDir, 'bug-report.json');
      const content = await fs.readFile(bugReportPath, 'utf-8');
      let conversation = loadConversation(content);
      
      // Pipeline: redact -> normalize -> classify
      conversation = redactConversation(conversation);
      expect(conversation.redacted).toBe(true);
      
      conversation = normalizeConversation(conversation);
      expect(conversation.normalized).toBe(true);
      
      conversation = classifyConversation(conversation);
      expect(conversation.classified).toBe(true);
      
      // Generate and gate candidate
      const candidate = generateCandidate(conversation);
      expect(candidate).toBeDefined();
      
      if (candidate) {
        const gated = applyGates(candidate);
        expect(candidatePassed(gated)).toBe(true);
      }
    });
  });
});
