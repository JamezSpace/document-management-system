import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Designation from "../../../../../domain/entities/office/Designation.js";

interface DesignationRepositoryPort {
	save(designation: Designation): Promise<Designation>;

	findDesignationById(id: string, tx?:TransactionContext): Promise<Designation | null>;

	fetchAll(): Promise<Designation[]>;

	fetchAllDesignationsWithinAnOffice(
		officeId: string,
	): Promise<{ 
        officeName: string;
        designations: Designation[] }>;
}

export type { DesignationRepositoryPort };

