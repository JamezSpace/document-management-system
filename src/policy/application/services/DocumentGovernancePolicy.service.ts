import type {
	DocumentGovernancePolicyPort,
	DocumentGovernanceAction as SharedDocumentGovernanceAction,
	DocumentGovernanceFacts,
	GovernanceDocumentSensitivity,
	GovernancePolicyReference,
	GovernanceActorRelationship,
} from "../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { DocumentGovernancePolicyRepositoryPort } from "../port/repo/DocumentGovernancePolicyRepo.port.js";
import type { DocumentGovernancePolicy } from "../../domain/documentGovernance/DocumentGovernancePolicy.js";
import type { DocumentGovernanceContext } from "../../domain/type/documentGovernanceContext.type.js";
import DocumentGovernancePolicyEvaluator from "../../domain/documentGovernance/DocumentGovernancePolicyEvaluator.js";
import { DocumentActorRelationship } from "../../domain/enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../../domain/enum/documentGovernanceAction.enum.js";
import { GovernanceSensitivityLevel } from "../../domain/enum/governanceSensitivityLevel.enum.js";

const DOCUMENT_GOVERNANCE_POLICY_KEY = "nexusfons_document_governance";

class DocumentGovernancePolicyService implements DocumentGovernancePolicyPort {
	private readonly versionCache = new Map<string, DocumentGovernancePolicy>();
	private activeCache: { policy: DocumentGovernancePolicy; expiresAt: number } | null = null;

	constructor(
		private readonly repository: DocumentGovernancePolicyRepositoryPort,
		private readonly activeCacheTtlMs = 5_000,
	) {}

	getSensitivityLevels(): readonly GovernanceDocumentSensitivity[] {
		return Object.values(GovernanceSensitivityLevel);
	}

	async getActivePolicyReference(): Promise<GovernancePolicyReference> {
		const policy = await this.loadActivePolicy();
		return this.reference(policy);
	}

	async evaluateAction(
		action: SharedDocumentGovernanceAction,
		facts: DocumentGovernanceFacts,
		policyReference: GovernancePolicyReference,
	) {
		const policy = await this.loadPolicyVersion(policyReference);
		const relationships = (facts.relationships ?? []).map((relationship) =>
			this.toRelationship(relationship),
		);

		const context: DocumentGovernanceContext = {
			action: this.toGovernanceAction(action),
			sensitivity: this.toSensitivity(facts.sensitivity),
			relationships,
		};
		if (facts.isAuthenticatedInternalStaff !== undefined) context.isAuthenticatedInternalStaff = facts.isAuthenticatedInternalStaff;
		if (facts.forwardDestination !== undefined) context.forwardDestination = facts.forwardDestination;
		if (facts.hasRecordedJustification !== undefined) context.hasRecordedJustification = facts.hasRecordedJustification;
		if (facts.hasDowngradeApproval !== undefined) context.hasDowngradeApproval = facts.hasDowngradeApproval;
		if (facts.isSensitivityDowngrade !== undefined) context.isSensitivityDowngrade = facts.isSensitivityDowngrade;
		if (facts.hasRequiredClearance !== undefined) context.hasRequiredClearance = facts.hasRequiredClearance;
		if (facts.hasActiveGuestReaderGrant !== undefined) context.hasActiveGuestReaderGrant = facts.hasActiveGuestReaderGrant;
		if (facts.hasEffectiveUnitHeadSignature !== undefined) context.hasEffectiveUnitHeadSignature = facts.hasEffectiveUnitHeadSignature;
		if (facts.exportGrant !== undefined) context.exportGrant = facts.exportGrant;
		if (facts.isInternalCanvas !== undefined) context.isInternalCanvas = facts.isInternalCanvas;

		return DocumentGovernancePolicyEvaluator.evaluate(policy, context);
	}

	private async loadActivePolicy(): Promise<DocumentGovernancePolicy> {
		const now = Date.now();
		if (this.activeCache && this.activeCache.expiresAt > now) {
			return this.activeCache.policy;
		}

		const policy = await this.repository.findActive(
			DOCUMENT_GOVERNANCE_POLICY_KEY,
			new Date(now),
		);
		if (!policy) this.policyNotFound(DOCUMENT_GOVERNANCE_POLICY_KEY, "active");

		this.activeCache = { policy, expiresAt: now + this.activeCacheTtlMs };
		this.versionCache.set(this.cacheKey(policy.policyKey, policy.policyVersion), policy);
		return policy;
	}

	private async loadPolicyVersion(reference: GovernancePolicyReference) {
		const key = this.cacheKey(reference.policyId, reference.policyVersion);
		const cached = this.versionCache.get(key);
		if (cached) return cached;

		const policy = await this.repository.findByVersion(
			reference.policyId,
			reference.policyVersion,
		);
		if (!policy) this.policyNotFound(reference.policyId, reference.policyVersion);

		this.versionCache.set(key, policy);
		return policy;
	}

	private policyNotFound(policyKey: string, version: number | "active"): never {
		throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, {
			message: `Document governance policy '${policyKey}' version '${version}' was not found`,
		});
	}

	private reference(policy: DocumentGovernancePolicy): GovernancePolicyReference {
		return { policyId: policy.policyKey, policyVersion: policy.policyVersion };
	}

	private cacheKey(policyKey: string, policyVersion: number): string {
		return `${policyKey}:${policyVersion}`;
	}

	private toGovernanceAction(action: SharedDocumentGovernanceAction) {
		return action as DocumentGovernanceAction;
	}

	private toSensitivity(sensitivity: GovernanceDocumentSensitivity) {
		return sensitivity as GovernanceSensitivityLevel;
	}

	private toRelationship(relationship: GovernanceActorRelationship) {
		return relationship as DocumentActorRelationship;
	}
}

export { DOCUMENT_GOVERNANCE_POLICY_KEY };
export default DocumentGovernancePolicyService;
