import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type OfficeDesignation from "../../../../domain/mappings/OfficeDesignation.js";

interface OfficeDesignationRepositoryPort {
    findById(officeDesigId: string): Promise<OfficeDesignation | null>;

    findDesignationWithinAnOffice(payload: {designationId: string, officeId: string}, tx?: TransactionContext): Promise<OfficeDesignation | null>;
}

export type {OfficeDesignationRepositoryPort}
