import * as S from "@railway-ts/pipelines/schema";

import { flowAsync, flow } from "@railway-ts/pipelines/composition";

import { type Option, some, none, isSome } from "@railway-ts/pipelines/option";

import {
  ok,
  err,
  isErr,
  mapWith,
  flatMapWith,
  tapWith,
  tapErrWith,
  orElseWith,
  fromPromiseWithError,
  combine,
  combineAll,
  partition,
  type Result,
} from "@railway-ts/pipelines/result";

// ===============================================================================
// Schema
// ===============================================================================

export const transactionSchema = S.object({
  id: S.required(S.chain(S.string(), S.nonEmpty("ID is required"))),
  customerEmail: S.required(
    S.chain(S.string(), S.nonEmpty("Email is required"), S.email()),
  ),
  amount: S.required(
    S.chain(S.parseNumber(), S.min(0.01, "Amount must be positive")),
  ),
  currency: S.required(
    S.chain(
      S.string(),
      S.nonEmpty("Currency is required"),
      S.refine(
        (s) => ["USD", "EUR", "GBP"].includes(s),
        "Unsupported currency",
      ),
    ),
  ),
  date: S.required(S.parseDate()),
});

export type Transaction = S.InferSchemaType<typeof transactionSchema>;

export type RawRecord = {
  row: number;
  data: Transaction;
};

// ===============================================================================
// Domain Types
// ===============================================================================

export type NormalizedTransaction = Transaction & {
  partial: false;
  amountUSD: number;
  dateFormatted: string;
};

export type EnrichedTransaction = NormalizedTransaction & {
  customerName: string;
  tier: string;
};

export type ValidationPipelineError = {
  kind: "validation";
  message: string;
  fields: Record<string, string>;
};

export type BusinessRuleError = {
  kind: "businessRule";
  rule: "minimumAmount" | "dateCutoff";
  message: string;
};

export type CustomerLookupError = {
  kind: "customerLookup";
  transactionId: string;
  customerEmail: string;
  message: string;
};

export type InfrastructureError = {
  kind: "infrastructure";
  operation: "customerLookup";
  message: string;
};

export type ETLError =
  | ValidationPipelineError
  | BusinessRuleError
  | CustomerLookupError
  | InfrastructureError;

export type PartialTransaction = {
  partial: true;
  id: string;
  message: string;
  error: CustomerLookupError;
};

export type ProcessedTransaction = EnrichedTransaction | PartialTransaction;

// ===============================================================================
// Trace Types - the instrumentation layer
// ===============================================================================

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
  error: ETLError;
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
  final: Result<ProcessedTransaction, ETLError>;
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
    failures: ETLError[];
  };
  combine: Result<ProcessedTransaction[], ETLError>;
  combineAll: Result<ProcessedTransaction[], ETLError[]>;
  durationMs: number;
};

// ===============================================================================
// Reference Data
// ===============================================================================

const USD_RATES: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27 };
export const MINIMUM_AMOUNT_USD = 10;

const MOCK_CUSTOMERS: Record<string, { name: string; tier: string }> = {
  "alice@example.com": { name: "Alice Smith", tier: "gold" },
  "carol@example.com": { name: "Carol Jones", tier: "silver" },
};

type Customer = { name: string; tier: string };
type CustomerLookup = (email: string) => Promise<Customer | undefined>;

const lookupCustomer: CustomerLookup = async (email) => MOCK_CUSTOMERS[email];

// ===============================================================================
// Individual Stage Functions (independently callable, pure)
// ===============================================================================

/**
 * Stage 1: Validate raw input against the transaction schema.
 * Returns validation errors as a formatted string.
 */
export const validateRaw = (raw: unknown): Result<Transaction, ETLError> => {
  const result = S.validate(raw, transactionSchema);
  if (isErr(result)) {
    const formatted = S.formatErrors(result.error);
    return err({
      kind: "validation",
      message: formatValidationFields(formatted),
      fields: formatted,
    });
  }
  return ok(result.value);
};

/**
 * Stage 2: Normalize a validated transaction - currency conversion + date formatting.
 * Pure transformation, always succeeds.
 */
export const normalize = (
  tx: Transaction,
): NormalizedTransaction => ({
    ...tx,
    partial: false,
    amountUSD: +(tx.amount * (USD_RATES[tx.currency] ?? 1)).toFixed(2),
    dateFormatted: tx.date.toISOString().split("T")[0],
  });

/**
 * Stage 3: Apply business rules - minimum amount + date cutoff.
 * Returns an error string describing which rule failed.
 */
export const applyBusinessRules = (
  tx: NormalizedTransaction,
): Result<NormalizedTransaction, ETLError> => {
  if (tx.amountUSD < MINIMUM_AMOUNT_USD) {
    return err({
      kind: "businessRule",
      rule: "minimumAmount",
      message: `Transaction below minimum ($${MINIMUM_AMOUNT_USD})`,
    });
  }
  if (tx.date < new Date("2025-01-01")) {
    return err({
      kind: "businessRule",
      rule: "dateCutoff",
      message: "Transaction too old",
    });
  }
  return ok(tx);
};

/**
 * Stage 4: Enrich with customer data from external source.
 * Async - in production this would be a real API call.
 */
export const enrichWithCustomerData = async (
  tx: NormalizedTransaction,
): Promise<Result<EnrichedTransaction, ETLError>> =>
  enrichWithCustomerDataUsing(tx, lookupCustomer);

export const enrichWithCustomerDataUsing = async (
  tx: NormalizedTransaction,
  customerLookup: CustomerLookup,
): Promise<Result<EnrichedTransaction, ETLError>> => {
  // Simulate network latency for realistic demo feel
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));

  const lookupResult = await fromPromiseWithError(
    customerLookup(tx.customerEmail),
    toCustomerLookupInfrastructureError,
  );
  if (isErr(lookupResult)) return err(lookupResult.error);

  const customer = lookupResult.value;
  if (!customer) {
    return err({
      kind: "customerLookup",
      transactionId: tx.id,
      customerEmail: tx.customerEmail,
      message: `Customer lookup failed for ${tx.customerEmail}`,
    });
  }
  return ok({ ...tx, customerName: customer.name, tier: customer.tier });
};

// ===============================================================================
// Helpers (private)
// ===============================================================================

const formatValidationFields = (fields: Record<string, string>): string =>
  Object.entries(fields)
    .map(([field, msg]) => `${field}: ${msg}`)
    .join("; ");

const getUnknownErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const toCustomerLookupInfrastructureError = (
  error: unknown,
): InfrastructureError => ({
  kind: "infrastructure",
  operation: "customerLookup",
  message: `Customer lookup unavailable: ${getUnknownErrorMessage(error)}`,
});

export const formatETLError = (error: ETLError): string => error.message;

const makePartialTx = (error: CustomerLookupError): PartialTransaction => ({
  partial: true,
  id: error.transactionId,
  message: "Processed without customer data",
  error,
});

const recoverCustomerLookup = (
  error: ETLError,
): Result<ProcessedTransaction, ETLError> =>
  error.kind === "customerLookup" ? ok(makePartialTx(error)) : err(error);

// ===============================================================================
// Composed Pipelines (non-instrumented, for direct use)
// ===============================================================================

/** Validate + normalize as a single composed step */
export const validateAndNormalize = flow(validateRaw, mapWith(normalize));

/** Full pipeline — compose all stages with error recovery for partial results */
export const processTransaction = flowAsync(
  validateRaw,
  mapWith(normalize),
  flatMapWith(applyBusinessRules),
  flatMapWith(enrichWithCustomerData),
  orElseWith(recoverCustomerLookup),
);

// ===============================================================================
// Tracer - observation layer via tapWith / tapErrWith
// ===============================================================================

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
  recordErr: (error: ETLError) => void;
  buildStages: () => StageTrace[];
};

/**
 * Create a per-record tracer. tapWith callbacks push ok entries;
 * a single tapErrWith at the end of the pipeline captures the final error.
 * buildStages() reconstructs the full stage picture after execution:
 *   - recorded entries -> "ok"
 *   - first gap after last ok -> "err" (the stage that failed)
 *   - everything after -> "skipped"
 */
const createTracer = (): Tracer => {
  const startTime = performance.now();
  const entries: TracerEntry[] = [];
  let errTimestamp = 0;
  let errMsg: Option<ETLError> = none();

  return {
    recordOk: (stage, value) => {
      entries.push({ stage, value, timestamp: performance.now() });
    },
    recordErr: (error) => {
      errTimestamp = performance.now();
      errMsg = some(error);
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
        if (prevWasOk && isSome(errMsg)) {
          const prevTime =
            entries.length > 0
              ? entries[entries.length - 1].timestamp
              : startTime;
          return {
            stage,
            status: "err",
            error: errMsg.value,
            durationMs: errTimestamp - prevTime,
          };
        }

        return { stage, status: "skipped", durationMs: 0 };
      });
    },
  };
};

// ===============================================================================
// Traced Pipeline - same composition as processTransaction, with taps woven in
// ===============================================================================

/**
 * Build a traced pipeline for a single record.
 * Fresh tracer per invocation so entries don't leak between records.
 *
 * The pipeline is a genuine flowAsync composition - taps observe
 * each stage without breaking the railway. On the ok track, tapWith
 * records the value. On the err track, tapErrWith captures the error
 * once (subsequent tapWith calls are no-ops on the err track).
 */
const createTracedPipeline = () => {
  const tracer = createTracer();

  const pipeline = flowAsync(
    validateRaw,
    tapWith((tx: Transaction) => tracer.recordOk("validate", tx)),
    mapWith(normalize),
    tapWith((tx: NormalizedTransaction) => tracer.recordOk("normalize", tx)),
    flatMapWith(applyBusinessRules),
    tapWith((tx: NormalizedTransaction) =>
      tracer.recordOk("businessRules", tx),
    ),
    flatMapWith(enrichWithCustomerData),
    tapWith((tx: EnrichedTransaction) => tracer.recordOk("enrich", tx)),
    tapErrWith((error: ETLError) => tracer.recordErr(error)),
    orElseWith(recoverCustomerLookup),
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
