import type {
	DocumentGovernancePolicyPort,
	GovernanceDocumentSensitivity,
	WorkspaceGovernanceAction,
	WorkspaceGovernanceFacts,
} from "../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import {
	DOCUMENT_GOVERNANCE_POLICY,
	type DocumentGovernanceContext,
} from "../../domain/documentGovernance/DocumentGovernancePolicy.js";
import DocumentGovernancePolicyEvaluator from "../../domain/documentGovernance/DocumentGovernancePolicyEvaluator.js";
import { DocumentActorRelationship } from "../../domain/enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../../domain/enum/documentGovernanceAction.enum.js";
import { GovernanceSensitivityLevel } from "../../domain/enum/governanceSensitivityLevel.enum.js";

class DocumentGovernancePolicyAdapter implements DocumentGovernancePolicyPort {
	getSensitivityLevels(): readonly GovernanceDocumentSensitivity[] {
		return Object.values(GovernanceSensitivityLevel);
	}

	evaluateWorkspaceAction(
		action: WorkspaceGovernanceAction,
		facts: WorkspaceGovernanceFacts,
	) {
		const relationships: DocumentActorRelationship[] = [];
		if (facts.isAuthor) {
			relationships.push(DocumentActorRelationship.AUTHOR);
		}
		if (facts.isPrimaryAuthorizingDesk) {
			relationships.push(
				DocumentActorRelationship.PRIMARY_AUTHORIZING_DESK,
			);
		}

		const context: DocumentGovernanceContext = {
			action: this.toGovernanceAction(action),
			sensitivity: this.toSensitivity(facts.sensitivity),
			relationships,
			isAuthenticatedInternalStaff:
				facts.isAuthenticatedInternalStaff,
		};

		if (facts.hasActiveExportGrant) {
			context.exportGrant = {
				active: true,
				grantedBy: "originator",
			};
		}

		return DocumentGovernancePolicyEvaluator.evaluate(context);
	}

	getPolicyReference() {
		return {
			policyId: DOCUMENT_GOVERNANCE_POLICY.id,
			policyVersion: DOCUMENT_GOVERNANCE_POLICY.version,
		};
	}

	private toGovernanceAction(
		action: WorkspaceGovernanceAction,
	): DocumentGovernanceAction {
		switch (action) {
			case "attach":
				return DocumentGovernanceAction.ATTACH;
			case "export":
				return DocumentGovernanceAction.EXPORT;
			case "manage_cc":
				return DocumentGovernanceAction.MANAGE_CC;
		}
	}

	private toSensitivity(
		sensitivity: GovernanceDocumentSensitivity,
	): GovernanceSensitivityLevel {
		switch (sensitivity) {
			case "public":
				return GovernanceSensitivityLevel.PUBLIC;
			case "internal":
				return GovernanceSensitivityLevel.INTERNAL;
			case "confidential":
				return GovernanceSensitivityLevel.CONFIDENTIAL;
			case "restricted":
				return GovernanceSensitivityLevel.RESTRICTED;
		}
	}
}

export default DocumentGovernancePolicyAdapter;
