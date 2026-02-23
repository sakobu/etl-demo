# ETL Pipeline Dashboard

[Live demo on StackBlitz](https://stackblitz.com/github/sakobu/etl-demo?file=src%2FApp.tsx)

> If StackBlitz appears stuck on "cloning from repo", hit refresh. This is a known StackBlitz bug.

An interactive demo application that visualizes Railway-Oriented Programming patterns through a simulated ETL pipeline. The schema is the single source of truth -- the same declaration drives pipeline validation, TypeScript types, and the editor form with no glue code between business logic and UI.

## What It Does

The app processes a batch of financial transaction records through a 4-stage pipeline and renders the results visually so you can see exactly how each record travels the success or error track at every stage.

Pipeline stages:

1. Validate -- schema validation on all fields
2. Normalize -- currency conversion to USD, date standardization
3. Business Rules -- minimum amount check, date cutoff enforcement
4. Enrich -- mock customer data lookup (failures are recovered as partial transactions)

The UI has three panels:

- Left panel -- manage records; add, edit, or delete transactions using a schema-driven form
- Center panel -- railway track visualization showing per-record stage progression
- Right panel -- batch semantics explorer with three tabs demonstrating `partition`, `combine`, and `combineAll`

## Tech Stack

- React 19, TypeScript 5.9, Vite 7
- Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`)
- Zustand v5
- [`@railway-ts/pipelines`](https://github.com/sakobu/railway-ts-pipelines) -- Result types, `flowAsync`, `combine`, `combineAll`, `partition`, tap operators
- [`@railway-ts/use-form`](https://github.com/sakobu/railway-ts-use-form) -- React form hook built on the same schema layer

## Getting Started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
  api/
    etl.ts              # Pipeline stages and batch execution logic
  store/
    etlStore.ts         # Zustand store (records, results, selection state)
  components/
    Header.tsx          # Top bar with Run Pipeline button
    StatusBar.tsx       # Summary counts (success / failure / partial)
    panels/
      left/             # Record list and editor form
      center/           # Railway visualization
      right/            # Batch semantics tabs
    ui/                 # Button, Input, Select, FormField primitives
```

## Key Concepts Demonstrated

**Railway-Oriented Programming** -- every pipeline stage returns a `Result` type. Records that fail a stage are routed to the error track and bypass subsequent stages, unless explicitly recovered.

**Tap-based tracing** -- `tapWith` and `tapErrWith` are woven into the `flowAsync` composition to capture per-stage timing and status without mutating the pipeline result.

**Batch semantics** -- the right panel shows the practical difference between three strategies:
- `partition` -- separates successes from failures, useful for ETL where partial success is acceptable
- `combine` -- fails the entire batch on the first error
- `combineAll` -- fails the entire batch and collects every error

**Schema as single source of truth** -- `transactionSchema` is declared once. It infers the TypeScript types, runs validation inside the pipeline, and powers the record editor form through `@railway-ts/use-form`. There is no resolver, no adapter, and no duplicated type definition. The same rules that reject a record in the pipeline are the same rules that show an inline error in the form.
