import type {
	DocumentGovernancePolicyPort,
	GovernanceDocumentSensitivity,
	GovernancePolicyReference,
	WorkspaceGovernanceAction,
	WorkspaceGovernanceFacts,
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

	async evaluateWorkspaceAction(
		action: WorkspaceGovernanceAction,
		facts: WorkspaceGovernanceFacts,
		policyReference: GovernancePolicyReference,
	) {
		const policy = await this.loadPolicyVersion(policyReference);
		const relationships: DocumentActorRelationship[] = [];
		if (facts.isAuthor) relationships.push(DocumentActorRelationship.AUTHOR);
		if (facts.isPrimaryAuthorizingDesk) {
			relationships.push(DocumentActorRelationship.PRIMARY_AUTHORIZING_DESK);
		}

		const context: DocumentGovernanceContext = {
			action: this.toGovernanceAction(action),
			sensitivity: this.toSensitivity(facts.sensitivity),
			relationships,
			isAuthenticatedInternalStaff: facts.isAuthenticatedInternalStaff,
		};
		if (facts.hasActiveExportGrant) {
			context.exportGrant = { active: true, grantedBy: "originator" };
		}

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

	private toGovernanceAction(action: WorkspaceGovernanceAction) {
		return {
			attach: DocumentGovernanceAction.ATTACH,
			export: DocumentGovernanceAction.EXPORT,
			manage_cc: DocumentGovernanceAction.MANAGE_CC,
		}[action];
	}

	private toSensitivity(sensitivity: GovernanceDocumentSensitivity) {
		return sensitivity as GovernanceSensitivityLevel;
	}
}

export { DOCUMENT_GOVERNANCE_POLICY_KEY };
export default DocumentGovernancePolicyService;
