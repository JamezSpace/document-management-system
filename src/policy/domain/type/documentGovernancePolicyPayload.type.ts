import type { DocumentGovernanceRule } from "../documentGovernance/DocumentGovernanceRule.js";
import type { DocumentGovernancePolicyStatus } from "../enum/documentGovernancePolicyStatus.enum.js";

interface DocumentGovernancePolicyPayload {
	id: string;
	policyKey: string;
	policyVersion: number;
	schemaVersion: number;
	status: DocumentGovernancePolicyStatus;
	effectiveFrom: Date;
	effectiveTo?: Date | null;
	definitionChecksum: string;
	createdBy: string;
	approvedBy?: string | null;
	approvalReason?: string | null;
	createdAt: Date;
	approvedAt?: Date | null;
	metadata: Record<string, unknown>;
	rules: DocumentGovernanceRule[];
}

export type { DocumentGovernancePolicyPayload };
