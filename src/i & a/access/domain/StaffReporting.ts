import DomainError from "../../../shared/errors/DomainError.error.js";
import {GlobalDomainErrors} from "../../../shared/errors/enum/domain.enum.js";

enum StaffReportingEnum {
	PRIMARY = "primary",
	DELEGATED = "delegated",
}

interface StaffReportingPayload {
	id: string;
	staffId: string;
	supervisorId: string;
	type: StaffReportingEnum;
	delegatedBy?: string | null;
	effectiveFrom: Date;
	effectiveTo?: Date | null;
	createdAt?: Date;
}

class StaffReporting {
	readonly id: string;
	readonly staffId: string;
	readonly supervisorId: string;
	readonly type: StaffReportingEnum;
	readonly delegatedBy?: string | null;
	readonly effectiveFrom: Date;
	readonly effectiveTo?: Date | null;
	readonly createdAt: Date;

	constructor(payload: StaffReportingPayload) {
		if (payload.type === StaffReportingEnum.DELEGATED) {
			if (!payload.delegatedBy) {
				throw new DomainError(
					GlobalDomainErrors.identity_authority.access
						.INVALID_CREDEDNTIALS,
					{
						details: {
							message:
								"Delegated reporting line must include delegatedBy.",
						},
					},
				);
			}

			if (!payload.effectiveTo) {
                throw new DomainError(GlobalDomainErrors.identity_authority.access.INVALID_CREDEDNTIALS, {
                    details: {
                        message: "Delegated reporting line must include effectiveTo."
                    }
                })
			}
		}

		this.id = payload.id;
		this.staffId = payload.staffId;
		this.supervisorId = payload.supervisorId;
		this.type = payload.type;
		this.delegatedBy = payload.delegatedBy ?? null;
		this.effectiveFrom = payload.effectiveFrom;
		this.effectiveTo = payload.effectiveTo ?? null;
		this.createdAt = payload.createdAt ?? new Date();
	}
}

export default StaffReporting;
