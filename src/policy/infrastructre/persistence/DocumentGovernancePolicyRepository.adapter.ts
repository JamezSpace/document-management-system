import type { PostgresDb } from "@fastify/postgres";
import type { DocumentGovernancePolicyRepositoryPort } from "../../application/port/repo/DocumentGovernancePolicyRepo.port.js";
import {
	DocumentGovernancePolicy,
} from "../../domain/documentGovernance/DocumentGovernancePolicy.js";
import type { DocumentGovernancePolicyPayload } from "../../domain/type/documentGovernancePolicyPayload.type.js";
import { DocumentGovernanceRule } from "../../domain/documentGovernance/DocumentGovernanceRule.js";
import { DocumentActorRelationship } from "../../domain/enum/documentActorRelationship.enum.js";
import { DocumentGovernanceAction } from "../../domain/enum/documentGovernanceAction.enum.js";
import { DocumentGovernancePolicyStatus } from "../../domain/enum/documentGovernancePolicyStatus.enum.js";
import { DocumentGovernanceRuleEffect } from "../../domain/enum/documentGovernanceRuleEffect.enum.js";
import { GovernanceObligation } from "../../domain/enum/governanceObligation.enum.js";
import { GovernanceSensitivityLevel } from "../../domain/enum/governanceSensitivityLevel.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import DomainError from "../../../shared/errors/DomainError.error.js";
import NexusError from "../../../shared/errors/NexusError.js";
import { GlobalDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import { Category } from "../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";

class DocumentGovernancePolicyRepositoryAdapter
	implements DocumentGovernancePolicyRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async findActive(policyKey: string, effectiveAt: Date) {
		return this.load(
			`WITH selected_policy AS (
				SELECT *
				FROM policy.document_governance_policies
				WHERE policy_key = $1
				  AND status = 'active'
				  AND effective_from <= $2
				  AND (effective_to IS NULL OR effective_to > $2)
				ORDER BY effective_from DESC, policy_version DESC
				LIMIT 1
			)
			SELECT selected_policy.*, rule.id AS rule_id,
				rule.sensitivity AS rule_sensitivity,
				rule.action AS rule_action,
				rule.effect AS rule_effect,
				rule.conditions AS rule_conditions,
				rule.obligations AS rule_obligations,
				rule.reason_code AS rule_reason_code,
				rule.priority AS rule_priority
			FROM selected_policy
			LEFT JOIN policy.document_governance_rules AS rule
				ON rule.governance_policy_id = selected_policy.id
			ORDER BY rule.priority, rule.id;`,
			[policyKey, effectiveAt],
		);
	}

	async findByVersion(policyKey: string, policyVersion: number) {
		return this.load(
			`SELECT policy_header.*, rule.id AS rule_id,
				rule.sensitivity AS rule_sensitivity,
				rule.action AS rule_action,
				rule.effect AS rule_effect,
				rule.conditions AS rule_conditions,
				rule.obligations AS rule_obligations,
				rule.reason_code AS rule_reason_code,
				rule.priority AS rule_priority
			FROM policy.document_governance_policies AS policy_header
			LEFT JOIN policy.document_governance_rules AS rule
				ON rule.governance_policy_id = policy_header.id
			WHERE policy_header.policy_key = $1
			  AND policy_header.policy_version = $2
			  AND policy_header.status <> 'draft'
			ORDER BY rule.priority, rule.id;`,
			[policyKey, policyVersion],
		);
	}

	private async load(query: string, parameters: unknown[]) {
		try {
			const result = await this.dbPool.query(query, parameters);
			if (result.rows.length === 0) return null;

			const header = result.rows[0];
			const rules = result.rows
				.filter((row) => row.rule_id !== null)
				.map(
					(row) =>
						new DocumentGovernanceRule({
							id: row.rule_id,
							sensitivity: row.rule_sensitivity === null
								? null
								: this.enumValue(GovernanceSensitivityLevel, row.rule_sensitivity, "sensitivity"),
							action: this.enumValue(DocumentGovernanceAction, row.rule_action, "action"),
							effect: this.enumValue(DocumentGovernanceRuleEffect, row.rule_effect, "effect"),
							conditions: this.conditions(row.rule_conditions),
							obligations: this.enumArray(GovernanceObligation, row.rule_obligations, "obligation"),
							reasonCode: row.rule_reason_code,
							priority: row.rule_priority,
						}),
				);

			const payload: DocumentGovernancePolicyPayload = {
				id: header.id,
				policyKey: header.policy_key,
				policyVersion: header.policy_version,
				schemaVersion: header.schema_version,
				status: this.enumValue(DocumentGovernancePolicyStatus, header.status, "status"),
				effectiveFrom: new Date(header.effective_from),
				effectiveTo: header.effective_to ? new Date(header.effective_to) : null,
				definitionChecksum: header.definition_checksum,
				createdBy: header.created_by,
				approvedBy: header.approved_by,
				approvalReason: header.approval_reason,
				createdAt: new Date(header.created_at),
				approvedAt: header.approved_at ? new Date(header.approved_at) : null,
				metadata: this.objectValue(header.metadata, "metadata"),
				rules,
			};

			return new DocumentGovernancePolicy(payload);
		} catch (error: any) {
			if (error instanceof NexusError) throw error;
			const postgresError = mapPostgresError(error);
			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}

	private enumValue<T extends Record<string, string>>(
		enumType: T,
		value: unknown,
		label: string,
	): T[keyof T] {
		if (typeof value !== "string" || !Object.values(enumType).includes(value)) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_GOVERNANCE_POLICY,
				{ message: `Unknown governance ${label} '${String(value)}'` },
			);
		}
		return value as T[keyof T];
	}

	private enumArray<T extends Record<string, string>>(
		enumType: T,
		value: unknown,
		label: string,
	): T[keyof T][] {
		if (!Array.isArray(value)) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_GOVERNANCE_POLICY,
				{ message: `Governance ${label}s must be an array` },
			);
		}
		return value.map((entry) => this.enumValue(enumType, entry, label));
	}

	private objectValue(value: unknown, label: string): Record<string, unknown> {
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_GOVERNANCE_POLICY,
				{ message: `Governance ${label} must be an object` },
			);
		}
		return value as Record<string, unknown>;
	}

	private conditions(value: unknown) {
		const object = this.objectValue(value, "conditions");
		if (Array.isArray(object.relationshipsAny)) {
			object.relationshipsAny = this.enumArray(
				DocumentActorRelationship,
				object.relationshipsAny,
				"actor relationship",
			);
		}
		return object as any;
	}
}

export default DocumentGovernancePolicyRepositoryAdapter;
