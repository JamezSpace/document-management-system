import DomainError from "../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import { DocumentActorRelationship } from "../enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../enum/documentGovernanceAction.enum.js";
import { DocumentGovernanceRuleEffect } from "../enum/documentGovernanceRuleEffect.enum.js";
import { GovernanceObligation } from "../enum/governanceObligation.enum.js";
import { GovernanceSensitivityLevel } from "../enum/governanceSensitivityLevel.enum.js";
import type { DocumentGovernanceContext } from "../type/documentGovernanceContext.type.js";
import type { DocumentGovernanceRuleConditions } from "../type/documentGovernanceRuleConditions.type.js";
import type { DocumentGovernanceRulePayload } from "../type/documentGovernanceRulePayload.type.js";

const conditionKeys = new Set<keyof DocumentGovernanceRuleConditions>([
	"relationshipsAny",
	"authenticatedInternalStaff",
	"forwardDestination",
	"recordedJustification",
	"activeUnexpiredDynamicGrant",
	"requiredClearance",
	"internalCanvas",
	"guestReaderRequiresActiveGrant",
	"downgradeRequiresApproval",
	"downgradeRequiresReason",
]);

class DocumentGovernanceRule {
	readonly id: string;
	readonly sensitivity: GovernanceSensitivityLevel | null;
	readonly action: DocumentGovernanceAction;
	readonly effect: DocumentGovernanceRuleEffect;
	readonly conditions: Readonly<DocumentGovernanceRuleConditions>;
	readonly obligations: readonly GovernanceObligation[];
	readonly reasonCode: string;
	readonly priority: number;

	constructor(payload: DocumentGovernanceRulePayload) {
		this.validate(payload);
		this.id = payload.id;
		this.sensitivity = payload.sensitivity;
		this.action = payload.action;
		this.effect = payload.effect;
		this.conditions = Object.freeze({ ...payload.conditions });
		this.obligations = Object.freeze([...payload.obligations]);
		this.reasonCode = payload.reasonCode;
		this.priority = payload.priority;
	}

	matches(context: DocumentGovernanceContext, now = new Date()): boolean {
		const conditions = this.conditions;
		const relationships = context.relationships ?? [];

		if (conditions.relationshipsAny) {
			const matchingRelationships = conditions.relationshipsAny.filter(
				(relationship) => relationships.includes(relationship),
			);
			if (matchingRelationships.length === 0) return false;

			if (
				conditions.guestReaderRequiresActiveGrant &&
				matchingRelationships.every(
					(relationship) =>
						relationship === DocumentActorRelationship.GUEST_READER,
				) &&
				!context.hasActiveGuestReaderGrant
			) {
				return false;
			}
		}

		if (
			conditions.authenticatedInternalStaff !== undefined &&
			Boolean(context.isAuthenticatedInternalStaff) !==
				conditions.authenticatedInternalStaff
		) return false;

		if (
			conditions.forwardDestination !== undefined &&
			context.forwardDestination !== conditions.forwardDestination
		) return false;

		if (
			conditions.recordedJustification !== undefined &&
			Boolean(context.hasRecordedJustification) !==
				conditions.recordedJustification
		) return false;

		if (
			conditions.requiredClearance !== undefined &&
			Boolean(context.hasRequiredClearance) !== conditions.requiredClearance
		) return false;

		if (
			conditions.internalCanvas !== undefined &&
			Boolean(context.isInternalCanvas) !== conditions.internalCanvas
		) return false;

		if (conditions.activeUnexpiredDynamicGrant) {
			const grant = context.exportGrant;
			if (!grant?.active) return false;
			if (grant.expiresAt && grant.expiresAt <= now) return false;
			if (grant.remainingUses !== undefined && grant.remainingUses !== null && grant.remainingUses <= 0) return false;
		}

		if (context.isSensitivityDowngrade) {
			if (conditions.downgradeRequiresApproval && !context.hasDowngradeApproval)
				return false;
			if (conditions.downgradeRequiresReason && !context.hasRecordedJustification)
				return false;
		}

		return true;
	}

	private validate(payload: DocumentGovernanceRulePayload): void {
		if (!payload.id || !payload.reasonCode || !Number.isInteger(payload.priority) || payload.priority < 0) {
			this.invalid("Governance rule identity, reason code, and priority are invalid");
		}

		if (
			(payload.sensitivity !== null &&
				!Object.values(GovernanceSensitivityLevel).includes(payload.sensitivity)) ||
			!Object.values(DocumentGovernanceAction).includes(payload.action) ||
			!Object.values(DocumentGovernanceRuleEffect).includes(payload.effect) ||
			payload.obligations.some(
				(obligation) => !Object.values(GovernanceObligation).includes(obligation),
			)
		) {
			this.invalid("Governance rule contains an unknown enum value");
		}

		for (const key of Object.keys(payload.conditions)) {
			if (!conditionKeys.has(key as keyof DocumentGovernanceRuleConditions)) {
				this.invalid(`Unknown governance condition '${key}'`);
			}
		}

		const relationships = payload.conditions.relationshipsAny;
		if (
			relationships &&
			(!Array.isArray(relationships) ||
				relationships.some(
					(value) => !Object.values(DocumentActorRelationship).includes(value),
				))
		) this.invalid("Governance rule contains an unknown actor relationship");

		for (const key of [
			"authenticatedInternalStaff",
			"recordedJustification",
			"activeUnexpiredDynamicGrant",
			"requiredClearance",
			"internalCanvas",
			"guestReaderRequiresActiveGrant",
			"downgradeRequiresApproval",
			"downgradeRequiresReason",
		] as const) {
			const value = payload.conditions[key];
			if (value !== undefined && typeof value !== "boolean") {
				this.invalid(`Governance condition '${key}' must be boolean`);
			}
		}

		if (
			payload.conditions.forwardDestination !== undefined &&
			!(["internal", "external"] as const).includes(
				payload.conditions.forwardDestination,
			)
		) this.invalid("Governance forward destination is invalid");
	}

	private invalid(message: string): never {
		throw new DomainError(
			GlobalDomainErrors.document.INVALID_GOVERNANCE_POLICY,
			{ message },
		);
	}
}

export { DocumentGovernanceRule };
