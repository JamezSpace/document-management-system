import type { EmploymentType, Status } from "../enum/staff.enum.js";

interface StaffDetailsBasePayload {
	id: string;
    authProviderId: string;
	identityId: string;
    firstName: string;
    lastName: string;
    middleName: string;
    fullName: string;
    email: string;
	staffNumber: number;
	employmentType: EmploymentType;
    unitId: string;
	unitSector: string;
	unitName: string;
	officeId: string;
	officeName: string;
	designationId: string;
	designationTitle: string;
	status: Status;
    createdAt: Date;
    createdBy: string;
    activatedBy: string;
    activatedAt: Date;
    updatedAt: Date;
}

export type { StaffDetailsBasePayload };
