[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PredictionAccuracyReport

# Interface: PredictionAccuracyReport

Defined in: src/analysis/index.ts:98

Accuracy statistics for past predictions — are we well-calibrated?

## Properties

### accuracy

> **accuracy**: `number`

Defined in: src/analysis/index.ts:104

***

### byConfidence

> **byConfidence**: `object`[]

Defined in: src/analysis/index.ts:106

Predictions sorted by confidence at time of prediction

#### actualObservation?

> `optional` **actualObservation?**: `string`

#### claim

> **claim**: `string`

#### outcome

> **outcome**: `"correct"` \| `"incorrect"` \| `"pending"`

#### predictedConfidence

> **predictedConfidence**: `number`

#### predictionId

> **predictionId**: `string`

***

### calibration

> **calibration**: `object`[]

Defined in: src/analysis/index.ts:114

Calibration: are 80% confidence predictions right 80% of the time?

#### actualRate

> **actualRate**: `number`

#### bucket

> **bucket**: `string`

#### count

> **count**: `number`

#### predictedRate

> **predictedRate**: `number`

***

### correct

> **correct**: `number`

Defined in: src/analysis/index.ts:101

***

### incorrect

> **incorrect**: `number`

Defined in: src/analysis/index.ts:102

***

### pending

> **pending**: `number`

Defined in: src/analysis/index.ts:103

***

### totalPredictions

> **totalPredictions**: `number`

Defined in: src/analysis/index.ts:99

***

### verified

> **verified**: `number`

Defined in: src/analysis/index.ts:100
