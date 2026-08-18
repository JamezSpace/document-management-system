import DomainError from "../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../shared/errors/enum/domain.enum.js";

interface DocumentRetentionPolicyPayload {
    id: string;
    archivalRequired: boolean;
    policyVersion?: number;
    retentionDuration: number;
    documentTypeId: string;
    effectiveFrom: Date;
    createdAt?: Date;
}

class DocumentRetentionPolicy {
    readonly id: string;
    readonly policyVersion: number | null;
    readonly archivalRequired: boolean;
    readonly documentTypeId: string;
    readonly retentionDuration: number;
    readonly effectiveFrom: Date;
    readonly createdAt: Date;

    constructor(payload: DocumentRetentionPolicyPayload) {
		if (
			!Number.isInteger(payload.retentionDuration) ||
			payload.retentionDuration <= 0
		) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_RETENTION_POLICY,
				{
					message: "Retention duration must be a positive whole number of years",
				},
			);
		}

		if (Number.isNaN(payload.effectiveFrom.getTime())) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_RETENTION_POLICY,
				{ message: "Retention policy effective date must be valid" },
			);
		}

        this.id = payload.id;
        this.documentTypeId = payload.documentTypeId;
        this.retentionDuration = payload.retentionDuration;
        this.policyVersion = payload.policyVersion ?? null;
        this.archivalRequired = payload.archivalRequired;
        this.effectiveFrom = payload.effectiveFrom;
		this.createdAt = payload.createdAt ?? new Date();
    }

    requiresArchival() {
        return this.archivalRequired;
    }
}

export default DocumentRetentionPolicy;
