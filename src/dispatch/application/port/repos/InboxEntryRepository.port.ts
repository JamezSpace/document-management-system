import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type InboxEntry from "../../../domain/entities/InboxEntry.js";
import type { InboxEntryPayload } from "../../../domain/entities/InboxEntry.js";

interface InboxEntryRepositoryPort {
	save(payload: InboxEntryPayload, tx?: TransactionContext): Promise<InboxEntry>;

	saveMany(
		payload: InboxEntryPayload[],
		tx?: TransactionContext,
	): Promise<InboxEntry[]>;

	fetchAll(): Promise<InboxEntry[]>;
}

export type { InboxEntryRepositoryPort };
