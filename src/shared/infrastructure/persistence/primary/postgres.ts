import type { PoolClient } from "pg";

interface TransactionContext {
  client: PoolClient;
}

export type {TransactionContext}