import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type DispatchRecord from "../../../domain/entities/DispatchRecord.js";

interface DispatchRecordRepositoryPort {
    save(payload: DispatchRecord, tx?: TransactionContext): Promise<DispatchRecord>;

    saveMany(payload: DispatchRecord[], tx?: TransactionContext): Promise<DispatchRecord[]>;

    fetchAll(): Promise<DispatchRecord[]>;
}

export type {DispatchRecordRepositoryPort};