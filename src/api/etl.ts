/**
 * Railway-Oriented TypeScript — ETL Pipeline (Phase 1: UI-Ready)
 *
 * Refactored for consumption by a React dashboard.
 * Every stage is independently callable and traced — no console side-effects.
 * The composed pipeline (`processTransaction`) is still available for
 * non-instrumented use, but `runRecord` / `runBatch` are the primary API.
 */

import {
  validate,
  object,
  required,
  chain,
  string,
  nonEmpty,
  email,
  parseNumber,
  min,
  parseDate,
  refine,
  formatErrors,
  type InferSchemaType,
} from "@railway-ts/pipelines/schema";

import { flowAsync, flow } from "@railway-ts/pipelines/composition";

import {
  ok,
  err,
  isErr,
  flatMapWith,
  tapWith,
  tapErrWith,
  orElseWith,
  combine,
  combineAll,
  partition,
  type Result,
} from "@railway-ts/pipelines/result";

// ═══════════════════════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════════════════════

export const transactionSchema = object({
  id: required(chain(string(), nonEmpty("ID is required"))),
  customerEmail: required(
    chain(string(), nonEmpty("Email is required"), email()),
  ),
  amount: required(chain(parseNumber(), min(0.01, "Amount must be positive"))),
  currency: required(
    chain(
      string(),
      nonEmpty("Currency is required"),
      refine((s) => ["USD", "EUR", "GBP"].includes(s), "Unsupported currency"),
    ),
  ),
  date: required(parseDate()),
});

export type Transaction = InferSchemaType<typeof transactionSchema>;

export type RawRecord = {
  row: number;
  data: Transaction;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Domain Types
// ═══════════════════════════════════════════════════════════════════════════════

export type NormalizedTransaction = Transaction & {
  partial: false;
  amountUSD: number;
  dateFormatted: string;
};

export type EnrichedTransaction = NormalizedTransaction & {
  customerName: string;
  tier: string;
};

export type PartialTransaction = {
  partial: true;
  id: string;
  message: string;
  error: string;
};

export type ProcessedTransaction = EnrichedTransaction | PartialTransaction;

// ═══════════════════════════════════════════════════════════════════════════════
// Trace Types — the instrumentation layer
// ═══════════════════════════════════════════════════════════════════════════════

export type StageName = "validate" | "normalize" | "businessRules" | "enrich";

export type StageTraceOk = {
  stage: StageName;
  status: "ok";
  value: unknown;
  durationMs: number;
};

export type StageTraceErr = {
  stage: StageName;
  status: "err";
  error: string;
  durationMs: number;
};

export type StageTraceSkipped = {
  stage: StageName;
  status: "skipped";
  durationMs: 0;
};

export type StageTrace = StageTraceOk | StageTraceErr | StageTraceSkipped;

export type RecordTrace = {
  row: number;
  rawInput: unknown;
  stages: StageTrace[];
  final: Result<ProcessedTransaction, string>;
};

export type BatchResult = {
  records: RecordTrace[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    partial: number;
  };
  partition: {
    successes: ProcessedTransaction[];
    failures: string[];
  };
  combine: Result<ProcessedTransaction[], string>;
  combineAll: Result<ProcessedTransaction[], string[]>;
  durationMs: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Reference Data
// ═══════════════════════════════════════════════════════════════════════════════

const USD_RATES: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27 };
export const MINIMUM_AMOUNT_USD = 10;

const MOCK_CUSTOMERS: Record<string, { name: string; tier: string }> = {
  "alice@example.com": { name: "Alice Smith", tier: "gold" },
  "carol@example.com": { name: "Carol Jones", tier: "silver" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Individual Stage Functions (independently callable, pure)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stage 1: Validate raw input against the transaction schema.
 * Returns validation errors as a formatted string.
 */
export const validateRaw = (raw: unknown): Result<Transaction, string> => {
  const result = validate(raw, transactionSchema);
  if (isErr(result)) {
    const formatted = formatErrors(result.error);
    return err(
      Object.entries(formatted)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join("; "),
    );
  }
  return result;
};

/**
 * Stage 2: Normalize a validated transaction — currency conversion + date formatting.
 * Pure transformation, always succeeds.
 */
export const normalize = (
  tx: Transaction,
): Result<NormalizedTransaction, string> =>
  ok({
    ...tx,
    partial: false,
    amountUSD: +(tx.amount * (USD_RATES[tx.currency] ?? 1)).toFixed(2),
    dateFormatted: tx.date.toISOString().split("T")[0],
  });

/**
 * Stage 3: Apply business rules — minimum amount + date cutoff.
 * Returns an error string describing which rule failed.
 */
export const applyBusinessRules = (
  tx: NormalizedTransaction,
): Result<NormalizedTransaction, string> => {
  if (tx.amountUSD < MINIMUM_AMOUNT_USD) {
    return err(`Transaction below minimum ($${MINIMUM_AMOUNT_USD})`);
  }
  if (tx.date < new Date("2025-01-01")) {
    return err("Transaction too old");
  }
  return ok(tx);
};

/**
 * Stage 4: Enrich with customer data from external source.
 * Async — in production this would be a real API call.
 */
export const enrichWithCustomerData = async (
  tx: NormalizedTransaction,
): Promise<Result<EnrichedTransaction, string>> => {
  // Simulate network latency for realistic demo feel
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));

  const customer = MOCK_CUSTOMERS[tx.customerEmail];
  if (!customer) {
    return err(`Customer lookup failed for ${tx.customerEmail}`);
  }
  return ok({ ...tx, customerName: customer.name, tier: customer.tier });
};

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers (private)
// ═══════════════════════════════════════════════════════════════════════════════

const makePartialTx = (error: string): PartialTransaction => ({
  partial: true,
  id: "unknown",
  message: "Processed without customer data",
  error,
});

// ═══════════════════════════════════════════════════════════════════════════════
// Composed Pipelines (non-instrumented, for direct use)
// ═══════════════════════════════════════════════════════════════════════════════

/** Validate + normalize as a single composed step */
export const validateAndNormalize = flow(validateRaw, flatMapWith(normalize));

/** Full pipeline — compose all stages with error recovery for partial results */
export const processTransaction = flowAsync(
  validateRaw,
  flatMapWith(normalize),
  flatMapWith(applyBusinessRules),
  flatMapWith(enrichWithCustomerData),
  orElseWith((error: string): Result<ProcessedTransaction, string> => {
    if (error.startsWith("Customer lookup failed")) {
      return ok(makePartialTx(error));
    }
    return err(error);
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// Tracer — observation layer via tapWith / tapErrWith
// ═══════════════════════════════════════════════════════════════════════════════

const STAGE_ORDER: readonly StageName[] = [
  "validate",
  "normalize",
  "businessRules",
  "enrich",
];

type TracerEntry = {
  stage: StageName;
  value: unknown;
  timestamp: number;
};

type Tracer = {
  recordOk: <T>(stage: StageName, value: T) => void;
  recordErr: (error: string) => void;
  buildStages: () => StageTrace[];
};

/**
 * Create a per-record tracer. tapWith callbacks push ok entries;
 * a single tapErrWith at the end of the pipeline captures the final error.
 * buildStages() reconstructs the full stage picture after execution:
 *   - recorded entries → "ok"
 *   - first gap after last ok → "err" (the stage that failed)
 *   - everything after → "skipped"
 */
const createTracer = (): Tracer => {
  const startTime = performance.now();
  const entries: TracerEntry[] = [];
  let errTimestamp = 0;
  let errMsg: string | undefined;

  return {
    recordOk: (stage, value) => {
      entries.push({ stage, value, timestamp: performance.now() });
    },
    recordErr: (error) => {
      errTimestamp = performance.now();
      errMsg = error;
    },
    buildStages: () => {
      const okSet = new Set(entries.map((e) => e.stage));

      return STAGE_ORDER.map((stage, i): StageTrace => {
        const entry = entries.find((e) => e.stage === stage);

        if (entry) {
          const prevTime =
            i === 0 ? startTime : (entries[i - 1]?.timestamp ?? startTime);
          return {
            stage,
            status: "ok",
            value: entry.value,
            durationMs: entry.timestamp - prevTime,
          };
        }

        // First missing stage whose predecessor was ok = the failing stage
        const prevWasOk = i === 0 || okSet.has(STAGE_ORDER[i - 1]);
        if (prevWasOk && errMsg !== undefined) {
          const prevTime =
            entries.length > 0
              ? entries[entries.length - 1].timestamp
              : startTime;
          return {
            stage,
            status: "err",
            error: errMsg,
            durationMs: errTimestamp - prevTime,
          };
        }

        return { stage, status: "skipped", durationMs: 0 };
      });
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Traced Pipeline — same composition as processTransaction, with taps woven in
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a traced pipeline for a single record.
 * Fresh tracer per invocation so entries don't leak between records.
 *
 * The pipeline is a genuine flowAsync composition — taps observe
 * each stage without breaking the railway. On the ok track, tapWith
 * records the value. On the err track, tapErrWith captures the error
 * once (subsequent tapWith calls are no-ops on the err track).
 */
const createTracedPipeline = () => {
  const tracer = createTracer();

  const pipeline = flowAsync(
    validateRaw,
    tapWith((tx: Transaction) => tracer.recordOk("validate", tx)),
    flatMapWith(normalize),
    tapWith((tx: NormalizedTransaction) => tracer.recordOk("normalize", tx)),
    flatMapWith(applyBusinessRules),
    tapWith((tx: NormalizedTransaction) =>
      tracer.recordOk("businessRules", tx),
    ),
    flatMapWith(enrichWithCustomerData),
    tapWith((tx: EnrichedTransaction) => tracer.recordOk("enrich", tx)),
    tapErrWith((error: string) => tracer.recordErr(error)),
    orElseWith((error: string): Result<ProcessedTransaction, string> => {
      if (error.startsWith("Customer lookup failed")) {
        return ok(makePartialTx(error));
      }
      return err(error);
    }),
  );

  return { pipeline, tracer };
};

/**
 * Run a single record through the traced pipeline.
 */
export const runRecord = async (
  row: number,
  raw: unknown,
): Promise<RecordTrace> => {
  const { pipeline, tracer } = createTracedPipeline();
  const final = await pipeline(raw);
  return { row, rawInput: raw, stages: tracer.buildStages(), final };
};

/**
 * Run a full batch and compute all aggregate semantics.
 */
export const runBatch = async (records: RawRecord[]): Promise<BatchResult> => {
  const batchStart = performance.now();

  const traces = await Promise.all(
    records.map(({ row, data }) => runRecord(row, data)),
  );

  const finals = traces.map((t) => t.final);
  const partitioned = partition(finals);

  // Count partials within successes
  const partialCount = partitioned.successes.filter((tx) => tx.partial).length;

  return {
    records: traces,
    summary: {
      total: records.length,
      succeeded: partitioned.successes.length - partialCount,
      failed: partitioned.failures.length,
      partial: partialCount,
    },
    partition: {
      successes: partitioned.successes,
      failures: partitioned.failures,
    },
    combine: combine(finals),
    combineAll: combineAll(finals),
    durationMs: performance.now() - batchStart,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Default Sample Data
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_RECORDS: RawRecord[] = [
  {
    row: 1,
    data: {
      id: "tx-001",
      customerEmail: "alice@example.com",
      amount: 150,
      currency: "EUR",
      date: new Date("2025-03-15"),
    },
  },
  {
    row: 2,
    data: {
      id: "tx-002",
      customerEmail: "bob@example.com",
      amount: 50,
      currency: "USD",
      date: new Date("2024-12-01"),
    },
  },
  {
    row: 3,
    data: {
      id: "tx-003",
      customerEmail: "carol@example.com",
      amount: 75,
      currency: "USD",
      date: new Date("2025-03-16"),
    },
  },
  {
    row: 4,
    data: {
      id: "tx-004",
      customerEmail: "alice@example.com",
      amount: 5,
      currency: "USD",
      date: new Date("2025-03-17"),
    },
  },
  {
    row: 5,
    data: {
      id: "tx-005",
      customerEmail: "unknown@example.com",
      amount: 200,
      currency: "GBP",
      date: new Date("2025-03-18"),
    },
  },
];
