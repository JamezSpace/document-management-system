import type StaffCapabilityClass from "../../../../../domain/entities/staff/StaffCapabilityClass.js";

interface StaffCapabilityClassRepositoryPort {
	save(capabilityClass: StaffCapabilityClass): Promise<StaffCapabilityClass>;

	findStaffCapabilityClassById(
		id: string,
	): Promise<StaffCapabilityClass | null>;

	fetchAll(): Promise<StaffCapabilityClass[]>;
}

export type { StaffCapabilityClassRepositoryPort };
