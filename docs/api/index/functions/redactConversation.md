[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / redactConversation

# Function: redactConversation()

> **redactConversation**(`conversation`): [`Conversation`](../interfaces/Conversation.md)

Defined in: src/conversations/redact.ts:47

Redact PII from a conversation

## Parameters

### conversation

[`Conversation`](../interfaces/Conversation.md)

The conversation whose turn content and metadata should be redacted

## Returns

[`Conversation`](../interfaces/Conversation.md)

A new conversation object with PII removed and `redacted` set to `true`
