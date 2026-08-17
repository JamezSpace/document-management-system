import type StaffReporting from "../../domain/StaffReporting.js";

interface StaffReportingRepositoryPort {
	save(staffReporting: StaffReporting): Promise<StaffReporting>;
}

export type {StaffReportingRepositoryPort};
