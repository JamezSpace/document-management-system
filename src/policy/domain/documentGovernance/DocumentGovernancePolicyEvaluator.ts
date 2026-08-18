import {
	DOCUMENT_GOVERNANCE_POLICY,
	type DocumentGovernanceContext,
	type GovernanceDecision,
} from "./DocumentGovernancePolicy.js";
import { DocumentActorRelationship } from "../enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../enum/documentGovernanceAction.enum.js";
import { GovernanceObligation } from "../enum/governanceObligation.enum.js";
import { GovernanceSensitivityLevel } from "../enum/governanceSensitivityLevel.enum.js";

class DocumentGovernancePolicyEvaluator {
	static evaluate(context: DocumentGovernanceContext): GovernanceDecision {
		switch (context.action) {
			case DocumentGovernanceAction.ASSIGN_SENSITIVITY:
				return this.decide(
					this.hasRelationship(context, DocumentActorRelationship.AUTHOR),
					"sensitivity_assignment_author_only",
				);
			case DocumentGovernanceAction.CHANGE_SENSITIVITY:
				return this.evaluateSensitivityChange(context);
			case DocumentGovernanceAction.DISCOVER:
			case DocumentGovernanceAction.VIEW:
				return this.evaluateRead(context);
			case DocumentGovernanceAction.FORWARD:
				return this.evaluateForward(context);
			case DocumentGovernanceAction.EXPORT:
			case DocumentGovernanceAction.PRINT:
				return this.evaluateExtraction(context);
			case DocumentGovernanceAction.ATTACH:
				return this.decide(
					[
						GovernanceSensitivityLevel.PUBLIC,
						GovernanceSensitivityLevel.INTERNAL,
					].includes(context.sensitivity),
					"attachments_blocked_for_sensitive_document",
				);
			case DocumentGovernanceAction.MANAGE_CC:
				return this.evaluateCcManagement(context);
			case DocumentGovernanceAction.RENDER_CC_HEADER:
				return this.evaluateCcRendering(context);
		}
	}

	private static evaluateSensitivityChange(
		context: DocumentGovernanceContext,
	): GovernanceDecision {
		if (!this.hasRelationship(context, DocumentActorRelationship.AUTHOR)) {
			return this.decide(false, "sensitivity_change_author_only");
		}

		if (!context.isSensitivityDowngrade) {
			return this.decide(true, "author_may_upgrade_sensitivity");
		}

		const obligations = [
			GovernanceObligation.REQUIRE_DOWNGRADE_APPROVAL,
			GovernanceObligation.REQUIRE_REASON,
			GovernanceObligation.AUDIT_SECURITY_EVENT,
		];
		const allowed = Boolean(
			context.hasDowngradeApproval && context.hasRecordedJustification,
		);

		return this.decide(
			allowed,
			allowed
				? "approved_sensitivity_downgrade"
				: "sensitivity_downgrade_requires_approval_and_reason",
			obligations,
		);
	}

	private static evaluateRead(
		context: DocumentGovernanceContext,
	): GovernanceDecision {
		switch (context.sensitivity) {
			case GovernanceSensitivityLevel.PUBLIC:
				return this.decide(true, "public_access");
			case GovernanceSensitivityLevel.INTERNAL:
				return this.decide(
					Boolean(context.isAuthenticatedInternalStaff),
					"internal_staff_access_only",
				);
			case GovernanceSensitivityLevel.CONFIDENTIAL: {
				const permitted = this.hasAnyRelationship(context, [
					DocumentActorRelationship.AUTHOR,
					DocumentActorRelationship.TARGET_HANDLER,
					DocumentActorRelationship.AUTHORIZED_CUSTODIAN,
					DocumentActorRelationship.UNIT_HEAD,
					DocumentActorRelationship.DELEGATED_UNIT_HEAD,
				]) || (
					this.hasRelationship(
						context,
						DocumentActorRelationship.GUEST_READER,
					) && Boolean(context.hasActiveGuestReaderGrant)
				);

				return this.decide(
					permitted,
					"confidential_explicit_or_custodian_access_only",
					[GovernanceObligation.AUDIT_SECURITY_EVENT],
				);
			}
			case GovernanceSensitivityLevel.RESTRICTED:
				return this.decide(
					this.hasRelationship(
						context,
						DocumentActorRelationship.NAMED_INDIVIDUAL,
					) && Boolean(context.hasRequiredClearance),
					"restricted_named_individual_and_clearance_required",
					[GovernanceObligation.AUDIT_SECURITY_EVENT],
				);
		}
	}

	private static evaluateForward(
		context: DocumentGovernanceContext,
	): GovernanceDecision {
		switch (context.sensitivity) {
			case GovernanceSensitivityLevel.PUBLIC:
				return this.decide(true, "public_forwarding_permitted");
			case GovernanceSensitivityLevel.INTERNAL:
				return this.decide(
					Boolean(
						context.isAuthenticatedInternalStaff &&
						context.forwardDestination === "internal",
					),
					"internal_forwarding_must_remain_internal",
				);
			case GovernanceSensitivityLevel.CONFIDENTIAL: {
				const isAuthorizedForwarder = this.hasAnyRelationship(context, [
					DocumentActorRelationship.AUTHOR,
					DocumentActorRelationship.AUTHORIZED_CUSTODIAN,
				]);
				const allowed = Boolean(
					isAuthorizedForwarder && context.hasRecordedJustification,
				);

				return this.decide(
					allowed,
					"confidential_forward_requires_custody_and_justification",
					[
						GovernanceObligation.REQUIRE_REASON,
						GovernanceObligation.AUDIT_JUSTIFICATION,
						GovernanceObligation.AUDIT_SECURITY_EVENT,
					],
				);
			}
			case GovernanceSensitivityLevel.RESTRICTED:
				return this.decide(
					false,
					"restricted_forwarding_prohibited",
					[GovernanceObligation.AUDIT_SECURITY_EVENT],
				);
		}
	}

	private static evaluateExtraction(
		context: DocumentGovernanceContext,
	): GovernanceDecision {
		switch (context.sensitivity) {
			case GovernanceSensitivityLevel.PUBLIC:
				return this.decide(true, "public_extraction_permitted");
			case GovernanceSensitivityLevel.INTERNAL:
				return this.decide(
					Boolean(context.isAuthenticatedInternalStaff),
					"internal_extraction_requires_internal_actor",
					[GovernanceObligation.INTERNAL_TRACEABILITY_WATERMARK],
				);
			case GovernanceSensitivityLevel.CONFIDENTIAL: {
				const grant = context.exportGrant;
				const unexpired = !grant?.expiresAt || grant.expiresAt > new Date();
				const hasUses = grant?.remainingUses == null || grant.remainingUses > 0;
				const allowed = Boolean(grant?.active && unexpired && hasUses);

				return this.decide(
					allowed,
					"confidential_extraction_requires_dynamic_grant",
					[
						GovernanceObligation.IDENTITY_TIMESTAMP_WATERMARK,
						GovernanceObligation.AUDIT_SECURITY_EVENT,
					],
				);
			}
			case GovernanceSensitivityLevel.RESTRICTED:
				return this.decide(
					false,
					"restricted_extraction_prohibited",
					[GovernanceObligation.AUDIT_SECURITY_EVENT],
				);
		}
	}

	private static evaluateCcManagement(
		context: DocumentGovernanceContext,
	): GovernanceDecision {
		if (context.sensitivity === GovernanceSensitivityLevel.RESTRICTED) {
			return this.decide(
				this.hasRelationship(
					context,
					DocumentActorRelationship.PRIMARY_AUTHORIZING_DESK,
				),
				"restricted_cc_managed_by_primary_authorizing_desk_only",
				[GovernanceObligation.AUDIT_SECURITY_EVENT],
			);
		}

		return this.decide(
			this.hasRelationship(context, DocumentActorRelationship.AUTHOR),
			"cc_management_author_only",
		);
	}

	private static evaluateCcRendering(
		context: DocumentGovernanceContext,
	): GovernanceDecision {
		switch (context.sensitivity) {
			case GovernanceSensitivityLevel.PUBLIC:
				return this.decide(true, "public_cc_header_visible");
			case GovernanceSensitivityLevel.INTERNAL:
				return this.decide(
					Boolean(context.isInternalCanvas),
					"internal_cc_header_internal_canvas_only",
				);
			case GovernanceSensitivityLevel.CONFIDENTIAL:
				return this.decide(
					false,
					"confidential_cc_header_redacted",
					[GovernanceObligation.REDACT_CC_HEADER],
				);
			case GovernanceSensitivityLevel.RESTRICTED:
				return this.decide(
					this.hasRelationship(
						context,
						DocumentActorRelationship.PRIMARY_AUTHORIZING_DESK,
					),
					"restricted_cc_header_primary_authorizing_desk_only",
					[GovernanceObligation.REDACT_CC_HEADER],
				);
		}
	}

	private static hasRelationship(
		context: DocumentGovernanceContext,
		relationship: DocumentActorRelationship,
	): boolean {
		return context.relationships?.includes(relationship) ?? false;
	}

	private static hasAnyRelationship(
		context: DocumentGovernanceContext,
		relationships: DocumentActorRelationship[],
	): boolean {
		return relationships.some((relationship) =>
			this.hasRelationship(context, relationship),
		);
	}

	private static decide(
		allowed: boolean,
		reasonCode: string,
		obligations: GovernanceObligation[] = [],
	): GovernanceDecision {
		return {
			allowed,
			policyId: DOCUMENT_GOVERNANCE_POLICY.id,
			policyVersion: DOCUMENT_GOVERNANCE_POLICY.version,
			reasonCode,
			obligations,
		};
	}
}

export default DocumentGovernancePolicyEvaluator;
