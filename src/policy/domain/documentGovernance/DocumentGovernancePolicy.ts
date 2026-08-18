import DomainError from "../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import { DocumentGovernancePolicyStatus } from "../enum/documentGovernancePolicyStatus.enum.js";
import type { DocumentGovernanceRule } from "./DocumentGovernanceRule.js";
import type { DocumentGovernancePolicyPayload } from "../type/documentGovernancePolicyPayload.type.js";

class DocumentGovernancePolicy {
	readonly id: string;
	readonly policyKey: string;
	readonly policyVersion: number;
	readonly schemaVersion: number;
	readonly status: DocumentGovernancePolicyStatus;
	readonly effectiveFrom: Date;
	readonly effectiveTo: Date | null;
	readonly definitionChecksum: string;
	readonly createdBy: string;
	readonly approvedBy: string | null;
	readonly approvalReason: string | null;
	readonly createdAt: Date;
	readonly approvedAt: Date | null;
	readonly metadata: Readonly<Record<string, unknown>>;
	readonly rules: readonly DocumentGovernanceRule[];

	constructor(payload: DocumentGovernancePolicyPayload) {
		if (
			!payload.id ||
			!payload.policyKey ||
			!Number.isInteger(payload.policyVersion) ||
			payload.policyVersion <= 0 ||
			payload.schemaVersion !== 1 ||
			Number.isNaN(payload.effectiveFrom.getTime()) ||
			(payload.effectiveTo !== undefined &&
				payload.effectiveTo !== null &&
				(Number.isNaN(payload.effectiveTo.getTime()) ||
					payload.effectiveTo <= payload.effectiveFrom)) ||
			!/^[a-f\d]{64}$/i.test(payload.definitionChecksum) ||
			!Object.values(DocumentGovernancePolicyStatus).includes(payload.status) ||
			!payload.createdBy ||
			Number.isNaN(payload.createdAt.getTime()) ||
			(payload.status !== DocumentGovernancePolicyStatus.DRAFT &&
				(!payload.approvedBy || !payload.approvedAt ||
					Number.isNaN(payload.approvedAt.getTime()))) ||
			payload.metadata.defaultEffect !== "deny" ||
			payload.rules.length === 0
		) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_GOVERNANCE_POLICY,
				{ message: "Stored document governance policy is invalid" },
			);
		}

		this.id = payload.id;
		this.policyKey = payload.policyKey;
		this.policyVersion = payload.policyVersion;
		this.schemaVersion = payload.schemaVersion;
		this.status = payload.status;
		this.effectiveFrom = new Date(payload.effectiveFrom);
		this.effectiveTo = payload.effectiveTo
			? new Date(payload.effectiveTo)
			: null;
		this.definitionChecksum = payload.definitionChecksum;
		this.createdBy = payload.createdBy;
		this.approvedBy = payload.approvedBy ?? null;
		this.approvalReason = payload.approvalReason ?? null;
		this.createdAt = new Date(payload.createdAt);
		this.approvedAt = payload.approvedAt ? new Date(payload.approvedAt) : null;
		this.metadata = Object.freeze({ ...payload.metadata });
		this.rules = Object.freeze(
			[...payload.rules].sort((left, right) => left.priority - right.priority),
		);
	}
}

export { DocumentGovernancePolicy };
