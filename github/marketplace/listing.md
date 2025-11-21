# Praxis Cloud - GitHub Marketplace Listing

## Application Name
Praxis Cloud

## Tagline
Local-first application framework with cloud sync and GitHub-native billing

## Categories
- Developer Tools
- Productivity
- Deployment

## Description

### What is Praxis Cloud?

Praxis Cloud is a comprehensive cloud synchronization and storage service for the Praxis application framework. It enables developers to build local-first applications with automatic cloud backup, team synchronization, and cross-device access.

### Key Features

- **🔄 Automatic Sync**: Real-time synchronization of application state across devices
- **💾 Cloud Storage**: Secure, encrypted storage for application data
- **👥 Team Collaboration**: Share and collaborate on projects with team members
- **🔒 GitHub-Native Auth**: Seamless authentication via GitHub OAuth
- **📊 Usage Analytics**: Track sync operations, storage, and team activity
- **⚡ CRDT-based**: Conflict-free replicated data types for offline-first apps
- **🌐 Azure-Powered**: Enterprise-grade infrastructure via Azure Functions and Blob Storage

### Perfect For

- **Solo Developers**: Building local-first applications with cloud backup
- **Small Teams**: Collaborating on distributed applications
- **Enterprises**: Running large-scale local-first systems with SLA guarantees

### How It Works

1. **Authenticate**: Connect via `praxis login` using GitHub OAuth
2. **Initialize**: Set up cloud sync with `praxis cloud init`
3. **Sync**: Automatic or manual synchronization of application state
4. **Collaborate**: Share projects with team members via GitHub organizations
5. **Monitor**: Track usage and limits with `praxis cloud usage`

### Technology Stack

- **Protocol**: Language-agnostic JSON-based protocol
- **Backend**: Azure Functions (serverless)
- **Storage**: Azure Blob Storage (encrypted)
- **Events**: Azure Event Grid for real-time updates
- **Auth**: GitHub OAuth 2.0
- **Billing**: GitHub Sponsors / Marketplace

### Integration

```typescript
import { connectRelay } from "@plures/praxis/cloud";

const relay = await connectRelay("https://praxis-relay.azurewebsites.net", {
  appId: "my-app",
  authToken: process.env.GITHUB_TOKEN,
  autoSync: true
});

await relay.sync({
  type: "delta",
  appId: "my-app",
  clock: {},
  facts: [...],
  timestamp: Date.now()
});
```

## Pricing Plans

### Free Tier
**$0/month**

Perfect for trying out Praxis Cloud.

**Included:**
- 1,000 sync operations/month
- 10 MB storage
- 1 application/project
- Community support

### Solo Plan
**$5/month** or **$50/year** (save $10)

For individual developers.

**Included:**
- 50,000 sync operations/month
- 1 GB storage
- 10 applications/projects
- Standard email support
- Everything in Free

### Team Plan
**$20/month** or **$200/year** (save $40)

For small teams.

**Included:**
- 500,000 sync operations/month
- 10 GB storage
- 50 applications/projects
- Up to 10 team members
- Standard email support
- Everything in Solo

### Enterprise Plan
**$50/month** or **$500/year** (save $100)

For large teams and organizations.

**Included:**
- 5,000,000 sync operations/month
- 100 GB storage
- 1,000 applications/projects
- Unlimited team members
- Priority support with SLA
- Custom integrations available
- Everything in Team

## Support

- **Documentation**: https://github.com/plures/praxis/tree/main/docs
- **Community**: https://github.com/plures/praxis/discussions
- **Issues**: https://github.com/plures/praxis/issues
- **Email**: support@plures.dev (paid plans)
- **Enterprise**: enterprise@plures.dev

## Screenshots

1. CLI Authentication Flow
2. Cloud Status Dashboard
3. Usage Metrics View
4. Team Management
5. Sync Operations Log

(Screenshots to be added before publishing)

## Setup Instructions

### Installation

```bash
# Install Praxis CLI
npm install -g @plures/praxis

# Authenticate with GitHub
praxis login

# Initialize cloud connection
praxis cloud init

# Check status
praxis cloud status
```

### Configuration

```bash
# Set up environment variables
export GITHUB_TOKEN=your_token_here
export PRAXIS_APP_ID=my-app

# Initialize in your project
cd my-project
praxis cloud init
```

### Usage

```bash
# Manual sync
praxis cloud sync

# Check usage
praxis cloud usage

# View current user
praxis whoami
```

## Privacy & Security

- **Data Encryption**: All data encrypted at rest and in transit
- **Access Control**: GitHub-based authentication and authorization
- **Compliance**: GDPR and SOC 2 compliant infrastructure
- **Data Location**: Azure regions (configurable)
- **Token Security**: Tokens stored with restricted permissions (0600)
- **No Third Parties**: Data never shared with third parties

## Terms of Service

By using Praxis Cloud, you agree to:

1. GitHub's Terms of Service
2. Praxis Cloud Terms of Service (https://praxis.dev/terms)
3. Microsoft Azure Acceptable Use Policy

## License

Praxis framework: MIT License
Praxis Cloud service: Proprietary

## Links

- **Homepage**: https://github.com/plures/praxis
- **Documentation**: https://github.com/plures/praxis/tree/main/docs
- **GitHub Sponsors**: https://github.com/sponsors/plures
- **Support**: support@plures.dev

## Webhook Configuration

For GitHub Marketplace integration, configure the following webhooks:

- **Marketplace Purchase**: `https://praxis-relay.azurewebsites.net/webhook/marketplace`
- **Events**: `purchased`, `cancelled`, `changed`, `pending_change`, `pending_change_cancelled`

## FAQs

### Q: Can I use my own Azure account?
**A:** Enterprise plans can configure custom Azure resources. Contact enterprise@plures.dev.

### Q: What happens if I exceed my limits?
**A:** Syncs will be rate-limited. Upgrade your plan to increase limits.

### Q: Can I cancel anytime?
**A:** Yes, cancel anytime via GitHub Marketplace. You'll have access until the end of your billing period.

### Q: Do you offer educational discounts?
**A:** Yes! Contact support@plures.dev with your educational institution email.

### Q: Is there a trial period?
**A:** The Free tier is always available. Paid plans can be cancelled within 7 days for a full refund.

### Q: How do I migrate existing data?
**A:** Use the `praxis cloud sync` command to upload existing application state.

## Changelog

### Version 0.1.0 (Current)
- Initial GitHub Marketplace listing
- Support for GitHub OAuth authentication
- GitHub Sponsors integration
- Auto-provisioning based on GitHub identity
- Usage tracking and limits enforcement
- CLI commands for authentication and cloud management

## Roadmap

- Multi-region support
- Advanced conflict resolution strategies
- Real-time collaboration features
- Mobile SDKs (iOS, Android)
- GraphQL API for custom integrations
- Audit logs and compliance reports
