# Getting Started with Praxis

Learn the fundamentals of Praxis by building a reactive task tracker. You'll use `createApp`, define a schema, and wire up rules — all in under 50 lines.

**Time:** 10–15 minutes  
**Level:** Beginner  
**Prerequisites:** Node.js 18+, basic TypeScript

## What You'll Build

A minimal task tracker that:

- Stores a list of tasks with `done` status
- Automatically counts remaining tasks via a rule
- Rejects invalid mutations with a constraint

## Step 1: Set Up the Project

```bash
mkdir praxis-tasks && cd praxis-tasks
npm init -y
npm install @plures/praxis
npm install -D typescript @types/node
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## Step 2: Define the Schema

Create `src/main.ts`:

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

// Schema — declare your reactive state paths
const Tasks = definePath<{ id: string; title: string; done: boolean }[]>('tasks', []);
const Remaining = definePath<number>('remaining', 0);
```

Each `definePath` declares a named piece of state with an initial value. Praxis tracks all paths reactively.

## Step 3: Add a Rule

Rules run automatically whenever their watched paths change:

```ts
// Rule — recompute "remaining" whenever "tasks" changes
const countRemaining = defineRule({
  id: 'tasks.countRemaining',
  watch: ['tasks'],
  evaluate: (values) => {
    const tasks = values['tasks'] as { done: boolean }[];
    const remaining = tasks.filter((t) => !t.done).length;
    return RuleResult.emit([fact('remaining.updated', { count: remaining })]);
  },
});
```

## Step 4: Add a Constraint

Constraints guard state transitions — if a constraint fails, the mutation is rejected:

```ts
// Constraint — prevent empty task titles
const titleRequired = defineConstraint({
  id: 'tasks.titleRequired',
  description: 'Every task must have a non-empty title',
  watch: ['tasks'],
  validate: (values) => {
    const tasks = values['tasks'] as { title: string }[];
    const invalid = tasks.find((t) => !t.title.trim());
    return invalid ? 'Task title cannot be empty' : true;
  },
});
```

## Step 5: Create the App and Run It

```ts
// Wire everything together
const app = createApp({
  name: 'task-tracker',
  schema: [Tasks, Remaining],
  rules: [countRemaining],
  constraints: [titleRequired],
});

// Add tasks
app.mutate('tasks', [
  { id: '1', title: 'Read Praxis docs', done: false },
  { id: '2', title: 'Build first app', done: false },
]);

console.log((app.facts().find((f) => f.tag === 'remaining.updated')?.payload as any)?.count);
// Expected output: 2

// Mark one task done
app.mutate('tasks', [
  { id: '1', title: 'Read Praxis docs', done: true },
  { id: '2', title: 'Build first app', done: false },
]);

console.log(app.query('remaining').current);
// Expected output: 1

// Try adding a task with empty title — rejected
const result = app.mutate('tasks', [
  { id: '1', title: 'Read Praxis docs', done: true },
  { id: '2', title: 'Build first app', done: false },
  { id: '3', title: '', done: false },
]);

console.log(result.accepted);
// Expected output: false
```

## Full Source

<details>
<summary>Click to expand <code>src/main.ts</code></summary>

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

const Tasks = definePath<{ id: string; title: string; done: boolean }[]>('tasks', []);
const Remaining = definePath<number>('remaining', 0);

const countRemaining = defineRule({
  id: 'tasks.countRemaining',
  watch: ['tasks'],
  evaluate: (values) => {
    const tasks = values['tasks'] as { done: boolean }[];
    const remaining = tasks.filter((t) => !t.done).length;
    return RuleResult.emit([fact('remaining.updated', { count: remaining })]);
  },
});

const titleRequired = defineConstraint({
  id: 'tasks.titleRequired',
  description: 'Every task must have a non-empty title',
  watch: ['tasks'],
  validate: (values) => {
    const tasks = values['tasks'] as { title: string }[];
    const invalid = tasks.find((t) => !t.title.trim());
    return invalid ? 'Task title cannot be empty' : true;
  },
});

const app = createApp({
  name: 'task-tracker',
  schema: [Tasks, Remaining],
  rules: [countRemaining],
  constraints: [titleRequired],
});

app.mutate('tasks', [
  { id: '1', title: 'Read Praxis docs', done: false },
  { id: '2', title: 'Build first app', done: false },
]);
console.log(app.query('remaining').current); // 2

app.mutate('tasks', [
  { id: '1', title: 'Read Praxis docs', done: true },
  { id: '2', title: 'Build first app', done: false },
]);
console.log(app.query('remaining').current); // 1

const result = app.mutate('tasks', [
  { id: '1', title: 'Read Praxis docs', done: true },
  { id: '2', title: 'Build first app', done: false },
  { id: '3', title: '', done: false },
]);
console.log(result.accepted); // false
```

</details>

## What's Next

- [Advanced Rules + Expectations](./advanced-rules.md) — composing rules, expectations, and priority ordering
- [Cloud Sync + Auth Workflow](./cloud-sync-auth.md) — sync state across devices with authentication
- [API Reference](../API.md)
