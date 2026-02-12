# Praxis Conversations Subsystem

The praxis-conversations subsystem provides a deterministic-first conversation ingestion pipeline for capturing, processing, and emitting conversation data.

## Pipeline

The subsystem follows a deterministic pipeline:

```
capture → redact → normalize → classify → candidates → gate → emit
```

### Pipeline Stages

1. **Capture**: Capture conversations from various sources (CLI, API, files)
2. **Redact**: Remove PII (email, phone, IP addresses) using deterministic patterns
3. **Normalize**: Normalize whitespace, code blocks, and formatting
4. **Classify**: Classify conversations using keyword-based rules (no LLM)
5. **Candidates**: Generate emission candidates (GitHub issues, docs, etc.)
6. **Gate**: Apply quality gates before emission
7. **Emit**: Emit to destinations (filesystem, GitHub)

## Schemas

### Conversation Schema

See `conversation.schema.json` for the full schema.

```json
{
  "id": "uuid",
  "timestamp": "ISO 8601",
  "turns": [
    {
      "role": "user|assistant|system",
      "content": "text",
      "timestamp": "ISO 8601"
    }
  ],
  "metadata": {
    "source": "github-copilot|cli|web",
    "userId": "string",
    "sessionId": "string",
    "tags": ["tag1", "tag2"]
  },
  "redacted": false,
  "normalized": false,
  "classified": false,
  "classification": {
    "category": "bug-report|feature-request|question|...",
    "confidence": 0.85,
    "tags": ["tag1", "tag2"]
  }
}
```

### Candidate Schema

See `candidate.schema.json` for the full schema.

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "type": "github-issue|github-pr|documentation|...",
  "title": "Short title",
  "body": "Full body content",
  "metadata": {
    "priority": "low|medium|high|critical",
    "labels": ["bug", "priority:high"],
    "assignees": ["username"]
  },
  "gateStatus": {
    "passed": true,
    "gates": [...]
  },
  "emitted": false
}
```

## CLI Usage

### Capture a Conversation

```bash
# Capture from file
praxis conversations capture -i conversation.json -o captured.json

# Create sample conversation
praxis conversations capture -o sample.json
```

### Process Through Pipeline

```bash
# Redact and normalize
praxis conversations push -i conversation.json -o processed.json

# Skip redaction
praxis conversations push -i conversation.json --skip-redaction
```

### Classify and Generate Candidate

```bash
# Classify conversation and generate candidate
praxis conversations classify -i conversation.json -o candidate.json
```

### Emit to Destination

```bash
# Emit to filesystem
praxis conversations emit -i candidate.json -e fs --output-dir ./output

# Emit to GitHub (dry run)
praxis conversations emit -i candidate.json -e github \
  --owner myorg --repo myrepo --dry-run

# Emit to GitHub (REQUIRES --commit-intent)
praxis conversations emit -i candidate.json -e github \
  --owner myorg --repo myrepo --token $GITHUB_TOKEN --commit-intent
```

## GitHub Emitter Gate

**CRITICAL**: The GitHub emitter is **HARD GATED** by the `--commit-intent` flag.

This prevents accidental issue creation. You **MUST** explicitly pass `--commit-intent` to emit to GitHub:

```bash
praxis conversations emit -i candidate.json -e github \
  --owner myorg --repo myrepo --commit-intent
```

Without `--commit-intent`, the command will fail with:

```
⛔ GATE BLOCKED: commit_intent=false

The GitHub emitter is HARD GATED by the --commit-intent flag.
This prevents accidental issue creation.

To emit to GitHub, add: --commit-intent
```

## Programmatic Usage

```typescript
import {
  captureConversation,
  redactConversation,
  normalizeConversation,
  classifyConversation,
  generateCandidate,
  applyGates,
  candidatePassed,
  emitToFS,
  emitToGitHub,
} from '@plures/praxis/conversations';

// Capture
const conversation = captureConversation({
  turns: [
    { role: 'user', content: 'I found a bug...' },
    { role: 'assistant', content: 'Thanks for reporting!' },
  ],
  metadata: { source: 'cli' },
});

// Process
let processed = redactConversation(conversation);
processed = normalizeConversation(processed);
processed = classifyConversation(processed);

// Generate candidate
const candidate = generateCandidate(processed);

// Gate
const gated = applyGates(candidate);
if (candidatePassed(gated)) {
  // Emit
  const result = await emitToFS(gated, {
    outputDir: './output/candidates',
  });
  
  console.log('Emitted:', result.emissionResult?.externalId);
}
```

## Classification Categories

The classifier uses deterministic keyword matching to identify:

- `bug-report`: bugs, errors, crashes
- `feature-request`: features, enhancements
- `question`: questions, help requests
- `documentation`: docs, guides, examples
- `performance`: performance, optimization

## Quality Gates

Before emission, candidates pass through these gates:

1. **minimum-length**: Content must be >= 50 characters
2. **valid-title**: Title must be 10-200 characters
3. **not-duplicate**: Not a duplicate (stub, would check existing issues)
4. **has-metadata**: Must have labels and priority

## Testing

Run tests:

```bash
npm test src/__tests__/conversations.test.ts
```

Test fixtures are in `test/fixtures/conversations/`.

## Examples

See `test/fixtures/conversations/` for example conversations:

- `bug-report.json`: Bug report conversation
- `feature-request.json`: Feature request conversation
- `question.json`: Question conversation

## License

MIT
