import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

interface DispatchStaffPort {
	// it returns an array considering the case where different people hold same designation
	getStaffIdsByDesignationAndUnit(payload: {
		designationId: string;
		unitId: string;
	}): Promise<{id: string}[]>;

    getStaffDetailsById(staffId: string, tx?: TransactionContext): Promise<{
        fullName: string;
		unitId: string;
        officeName: string;
        designationId: string;
    }>
}

export type { DispatchStaffPort };
