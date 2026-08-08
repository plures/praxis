[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / generateResearchQuestions

# Function: generateResearchQuestions()

> **generateResearchQuestions**(`analysis`): [`ResearchQuestion`](../interfaces/ResearchQuestion.md)[]

Defined in: src/research/index.ts:89

Generate research questions from an analysis report.
Each recommendation category maps to a different research strategy.

## Parameters

### analysis

[`IntrospectionReport`](../interfaces/IntrospectionReport.md)

The system analysis report from [analyze](analyze.md)

## Returns

[`ResearchQuestion`](../interfaces/ResearchQuestion.md)[]

Array of [ResearchQuestion](../interfaces/ResearchQuestion.md) objects sorted by priority (impact × feasibility)
