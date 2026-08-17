import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Minute from "../../../domain/entities/minute/Minute.js";

interface MinuteRepositoryPort {
	save(minute: Minute, tx?: TransactionContext): Promise<Minute>;

	findById(minuteId: string, tx?: TransactionContext): Promise<Minute | null>;

	findByDocumentId(
		documentId: string,
		tx?: TransactionContext,
	): Promise<Minute[]>;
}

export type { MinuteRepositoryPort };
