import { describe, expect, test } from "vitest";
import { isErr, isOk } from "@railway-ts/pipelines/result";
import {
  formatETLError,
  processTransaction,
  runBatch,
  validateRaw,
  type Transaction,
} from "./etl";

const validTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "tx-test",
  customerEmail: "alice@example.com",
  amount: 25,
  currency: "USD",
  date: new Date("2025-03-15"),
  ...overrides,
});

describe("etl pipeline", () => {
  test("recovers customer lookup failures as partial transactions with the source id", async () => {
    const result = await processTransaction(
      validTransaction({
        id: "tx-missing-customer",
        customerEmail: "missing@example.com",
      }),
    );

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.partial).toBe(true);
    if (!result.value.partial) return;

    expect(result.value.id).toBe("tx-missing-customer");
    expect(result.value.error.kind).toBe("customerLookup");
    expect(formatETLError(result.value.error)).toBe(
      "Customer lookup failed for missing@example.com",
    );
  });

  test("keeps validation errors structured while preserving readable formatting", () => {
    const result = validateRaw({
      id: "",
      customerEmail: "not-an-email",
      amount: 0,
      currency: "CAD",
      date: "not-a-date",
    });

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;

    expect(result.error.kind).toBe("validation");
    if (result.error.kind !== "validation") return;

    expect(result.error.fields.customerEmail).toBeDefined();
    expect(formatETLError(result.error)).toContain("customerEmail:");
  });

  test("batch aggregation keeps typed errors for failed records", async () => {
    const result = await runBatch([
      { row: 1, data: validTransaction() },
      {
        row: 2,
        data: validTransaction({
          id: "tx-too-small",
          amount: 1,
        }),
      },
    ]);

    expect(result.partition.failures).toHaveLength(1);
    expect(result.partition.failures[0]?.kind).toBe("businessRule");
    expect(isErr(result.combine)).toBe(true);
    if (!isErr(result.combine)) return;
    expect(result.combine.error.kind).toBe("businessRule");
  });
});
