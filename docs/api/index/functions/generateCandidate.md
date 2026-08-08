[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / generateCandidate

# Function: generateCandidate()

> **generateCandidate**(`conversation`): [`Candidate`](../interfaces/Candidate.md) \| `null`

Defined in: src/conversations/candidates.ts:15

Generate a candidate from a conversation

## Parameters

### conversation

[`Conversation`](../interfaces/Conversation.md)

A classified conversation to generate an emission candidate from

## Returns

[`Candidate`](../interfaces/Candidate.md) \| `null`

A [Candidate](../interfaces/Candidate.md) ready for gating and emission, or `null` if the conversation has no user turns
