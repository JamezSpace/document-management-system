import type { EmploymentType, InviteStatus } from "../../enum/staff.enum.js";

interface InvitePayload {
    id: string;
	email: string;
    unitId: string;
	officeId: string;
	designationId: string;
	employmentType: EmploymentType;
	invitedBy: string;
    token: string;
    isUsed: boolean;
    expiresAt: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    status: InviteStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

class Invite {
	id: string;
	email: string;
	unitId: string;
	officeId: string;
	designationId: string;
	employmentType: EmploymentType;
	invitedBy: string;
    token: string;
    isUsed: boolean;
    expiresAt: Date;
    acceptedAt: Date | null;
    rejectedAt: Date | null;
    status: InviteStatus;
    createdAt: Date;
    updatedAt?: Date | null;

	constructor(payload: InvitePayload) {
        this.id = payload.id;
        this.email = payload.email;
        this.unitId = payload.unitId;
        this.officeId = payload.officeId;
        this.designationId = payload.designationId;
        this.employmentType = payload.employmentType;
        this.invitedBy = payload.invitedBy;
        this.token = payload.token;
        this.isUsed = payload.isUsed;
        this.expiresAt = payload.expiresAt;
        this.acceptedAt = payload.acceptedAt ?? null;
        this.rejectedAt = payload.rejectedAt ?? null;
        this.status = payload.status;

        this.createdAt = payload.createdAt ?? new Date();
        this.updatedAt = payload.updatedAt ?? null;
    }
}

export default Invite;
export type {InvitePayload}