import type { EmploymentType, Status } from "../../enum/staff.enum.js";
import type { StaffDetailsBasePayload } from "../../type/staffDetailsBasePayload.type.js";


abstract class AbstractStaffDetails {
    protected readonly id: string;
	readonly authProviderId: string;
	readonly identityId: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly middleName: string;
    readonly fullName: string;
    readonly email: string;
	readonly staffNumber: number;
	readonly employmentType: EmploymentType;
    readonly unit: {
        id: string;
        name: string;
        sector: string;
    };
	readonly office: {
        id: string;
        name: string;
    };
    readonly designation: {
        id: string;
        title: string;
    }
	status: Status;
    readonly createdAt: Date;
    readonly createdBy: string;
    readonly activatedBy: string;
    readonly activatedAt: Date;
    readonly updatedAt?: Date | undefined;

    constructor(payload: StaffDetailsBasePayload) {
		this.id = payload.id;
        this.authProviderId = payload.authProviderId
		this.identityId = payload.identityId;
        this.firstName = payload.firstName;
        this.lastName = payload.lastName;
        this.middleName = payload.middleName;
        this.fullName = payload.fullName;
        this.email = payload.email;
		this.staffNumber = payload.staffNumber;
		this.employmentType = payload.employmentType;
        this.unit = {
            id: payload.unitId,
            name: payload.unitName,
            sector: payload.unitSector
        };	
		this.office = {
            id: payload.officeId,
            name: payload.officeName
        };
		this.designation = {
            id: payload.designationId,
            title: payload.designationTitle
        };
		this.status = payload.status;
        this.createdBy = payload.createdBy;
        this.activatedBy = payload.activatedBy;

        this.createdAt = payload.createdAt;
        this.activatedAt = payload.activatedAt;
		this.updatedAt = payload.updatedAt;
    }

    getStaffId() {
		return this.id;
	}
}

export default AbstractStaffDetails;