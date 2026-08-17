import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type LifecycleHistory from "../../../domain/valueobjects/LifecycleHistory.js";

interface LifecycleHistoryRepositoryPort {
	save(payload:LifecycleHistory, tx?: TransactionContext): Promise<void>;
}

export type {LifecycleHistoryRepositoryPort}