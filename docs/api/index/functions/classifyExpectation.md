[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / classifyExpectation

# Function: classifyExpectation()

> **classifyExpectation**(`exp`): [`ClassificationResult`](../interfaces/ClassificationResult.md)

Defined in: src/lifecycle/expectation.ts:194

Classify an expectation based on its content.

Uses keyword matching against title + description + acceptance criteria.
In the future, this could use an LLM for more nuanced classification.

## Parameters

### exp

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)

The lifecycle expectation to classify

## Returns

[`ClassificationResult`](../interfaces/ClassificationResult.md)

A [ClassificationResult](../interfaces/ClassificationResult.md) with suggested type, priority, confidence, and labels
