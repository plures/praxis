# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

The Praxis team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

To report a security vulnerability, please email **security@plures.dev** (or create a private security advisory on GitHub).

Include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if available)
- Impact of the vulnerability, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge your email within 48 hours
- **Updates**: We will send updates about the progress every 5-7 days
- **Disclosure**: We aim to disclose vulnerabilities within 90 days of the report
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

### Security Update Process

1. Security vulnerability is reported privately
2. Team confirms the vulnerability and determines severity
3. Patch is developed and tested
4. Security advisory is published
5. Patch is released across supported versions
6. Public disclosure after users have had time to update

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, and service disruption
- Only interact with accounts you own or with explicit permission of the account holder
- Do not exploit a vulnerability beyond what is necessary to confirm its existence

### Security Best Practices for Users

When using Praxis:

- Keep your dependencies up to date
- Review generated code before deploying to production
- Use environment variables for sensitive configuration
- Follow the principle of least privilege for system access
- Enable security features in your runtime environment (Node.js/Deno)
- Regularly audit your application's security posture

### Security Features

Praxis includes:

- Type-safe schemas and validation
- Secure template rendering
- Input sanitization in generated components
- No eval() or unsafe code execution
- Minimal dependencies to reduce attack surface

### Third-Party Dependencies

We regularly audit our dependencies for known vulnerabilities. If you discover a vulnerability in one of our dependencies, please report it to us and we will work to update or replace the affected dependency.

## Contact

For security-related questions or concerns, contact: **security@plures.dev**

For non-security issues, please use the [GitHub issue tracker](https://github.com/plures/praxis/issues).

---

**Last Updated**: 2025-01-18
