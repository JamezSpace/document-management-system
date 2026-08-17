import DomainError from "../../../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../../../shared/errors/enum/domain.enum.js";
import { Status, type EmploymentType } from "../../enum/staff.enum.js";

interface StaffPayload {
    id: string;
	identityId: string;
	staffNumber: number;
	employmentType: EmploymentType;
	unitId: string;
	officeId: string;
	designationId: string;
	status: Status;
	createdAt?: Date;
    createdBy : string;
	activatedBy?: string;
	activatedAt? : Date;
	updatedAt?: Date;
}

class Staff {
    protected readonly id: string;
	readonly identityId: string;
	readonly staffNumber: number;
	readonly employmentType: EmploymentType;
	readonly unitId: string;
	readonly officeId: string;
	readonly designationId: string;
	status: Status;
	readonly createdAt: Date;
    readonly createdBy : string;
	readonly activatedBy? : string | undefined;
	readonly activatedAt?: Date | undefined;
	readonly updatedAt?: Date | undefined;

	constructor(payload: StaffPayload) {
        this.id = payload.id;
		this.identityId = payload.identityId;
		this.staffNumber = payload.staffNumber;
		this.employmentType = payload.employmentType;
		this.unitId = payload.unitId;
		this.officeId = payload.officeId;
		this.designationId = payload.designationId;
		this.status = payload.status;
        this.createdBy = payload.createdBy;
        this.activatedBy = payload.activatedBy;
        this.activatedAt = payload.activatedAt;

		this.createdAt = payload.createdAt ?? new Date();
		this.updatedAt = payload.updatedAt;
	}

    getStaffId() {
		return this.id;
	}

	public activate(hasProfilePic: boolean, hasSignature: boolean) {
		if (!hasProfilePic || !hasSignature) {
			throw new DomainError(
                GlobalDomainErrors.identity_authority.identity.INCOMPLETE_REQUEST,
                {
                    details: {
                        message: "Staff cannot be activated without required legal assets."
                    }
                }
			);
		}

		this.status = Status.ACTIVE;
	}
}


export default Staff;
