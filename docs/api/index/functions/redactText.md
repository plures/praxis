[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / redactText

# Function: redactText()

> **redactText**(`text`): `string`

Defined in: src/conversations/redact.ts:33

Redact PII from a text string using deterministic patterns

## Parameters

### text

`string`

The input text that may contain PII

## Returns

`string`

A new string with emails, phone numbers, credit-card numbers, SSNs, and IP addresses replaced by redaction tokens
