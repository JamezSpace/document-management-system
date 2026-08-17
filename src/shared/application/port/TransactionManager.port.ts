import type { TransactionContext } from "../../infrastructure/persistence/primary/postgres.js";

interface TransactionManager {
	execute<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}

export type { TransactionManager };
