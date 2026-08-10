import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Staff from "../../../../../domain/entities/staff/Staff.js";
import type AbstractStaffDetails from "../../../../../domain/views/staff/AbstractStaffDetails.js";
import type StaffDetailsWithMedia from "../../../../../domain/views/staff/StaffDetailsWithMedia.js";

interface StaffRepositoryPort {
	findStaffWithoutMediaById(staffId: string): Promise<Staff | null>;

	findStaffWithMediaByStaffId(
		staffId: string,
	): Promise<StaffDetailsWithMedia | null>;

	findStaffByAuthProviderId(authProviderId: string): Promise<Staff | null>;

	save(staff: Staff, tx?: TransactionContext): Promise<Staff>;

	updateStaff(
		dataPayload: { staffId: string; changesToMake: Partial<Staff> },
		tx?: TransactionContext,
	): Promise<Staff>;

	fetchAllStaffMembersByUnit(unitId: string): Promise<AbstractStaffDetails[]>;

	fetchAll(): Promise<AbstractStaffDetails[]>;

	fetchAllStaffWithMedia(): Promise<StaffDetailsWithMedia[]>;

	deleteStaff(staffId: string): Promise<void>;
}

export type { StaffRepositoryPort };

