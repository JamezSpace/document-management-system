import type { DocumentGovernancePolicy } from "../../../domain/documentGovernance/DocumentGovernancePolicy.js";

interface DocumentGovernancePolicyRepositoryPort {
	findActive(policyKey: string, effectiveAt: Date): Promise<DocumentGovernancePolicy | null>;
	findByVersion(policyKey: string, policyVersion: number): Promise<DocumentGovernancePolicy | null>;
}

export type { DocumentGovernancePolicyRepositoryPort };
