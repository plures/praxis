# ⚠️ DEPRECATED

This module is deprecated. Use `@plures/praxis-pluresdb` instead.

The legacy `InMemoryPraxisDB` and `PluresDBPraxisAdapter` remain for
backward compatibility but new code should use `PluresDBNativeAdapter`
from `@plures/praxis-pluresdb`.

```typescript
// Old (deprecated)
import { createPluresDB } from './adapter.js';

// New
import { PluresDBNativeAdapter } from '@plures/praxis-pluresdb';
```
