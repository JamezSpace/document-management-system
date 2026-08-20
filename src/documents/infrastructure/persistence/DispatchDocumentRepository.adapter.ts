import type { PostgresDb } from "@fastify/postgres";
import type { DispatchDocumentPort } from "../../../shared/application/port/intersubsystem/DispatchDocument.port.js";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import DocumentEntity from "../../domain/entities/document/Document.js";
import DocumentVersion from "../../domain/entities/document/DocumentVersion.js";
import { LifecycleState } from "../../domain/enum/lifecycleState.enum.js";

class DispatchDocumentEntity extends DocumentEntity {
	isDispatchable() {
		const currentVersion = this.getCurrentVersion();

		if (!currentVersion) return false;

		// External documents enter review before dispatch; internal documents
		// become active immediately when submitted.
		return (
			currentVersion.getState() === LifecycleState.IN_REVIEW ||
			currentVersion.getState() === LifecycleState.ACTIVE
		);
	}
}

class DispatchDocumentAdapter implements DispatchDocumentPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any): DispatchDocumentEntity {
		const version = row.current_version_id
			? new DocumentVersion({
					documentId: row.id,
					id: row.version_id,
					mediaId: row.media_id,
					contentDelta: row.content_delta,
					versionNumber: row.version_number,
					createdAt: row.version_created_at,
					createdBy: row.version_created_by,
					lifecycle: {
						currentState: row.lifecycle_state,
						stateEnteredAt: row.version_state_entered_at,
						stateEnteredBy: row.version_state_entered_by,
					},
				})
			: null;

		const addressees = (row.addressees ?? []).map((a: any) => ({
			recipientUnitId: a.recipient_unit_id,
			addressedToDesignationId: a.addressed_to_designation_id,
			isPrimary: a.is_primary,
		}));

		return new DispatchDocumentEntity({
			id: row.id,
			ownerId: row.owner_id,
			title: row.title,
			version,
			referenceNumber: row.reference_number,
			addressees,
			correspondence: {
				originatingUnitId: row.originating_unit_id,
				subjectCodeId: row.subject_code_id,
				direction: row.direction,
			},
			classification: {
				sensitivity: row.sensitivity,
				governancePolicyKey: row.governance_policy_key,
				governancePolicyVersion: row.governance_policy_version,
				functionCodeId: row.business_function_id,
				documentTypeId: row.document_type_id,
				classifiedBy: row.classified_by,
				classifiedAt: row.classified_at,
				lastReclassifiedAt: row.last_reclassified_at,
				lastReclassifiedBy: row.last_reclassified_by,
			},
			retention: {
				policyVersion: row.policy_version,
				retentionScheduleId: row.retention_schedule_id,
				retentionStartDate: row.retention_start_date,
				disposalEligibilityDate: row.disposal_eligibility_date,
				archivalRequired: row.archival_required,
			},
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		});
	}

	async getDocumentById(
		documentId: string,
		tx?: TransactionContext,
	): Promise<DispatchDocumentEntity | null> {
		try {
			const query = `
				SELECT details.*, source.governance_policy_key, source.governance_policy_version
				FROM document.full_document_details details
				JOIN document.documents source ON source.id = details.id
				WHERE details.id = $1
				LIMIT 1;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [documentId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}

	async getDocAddresseesByDocIdMultiple(
		documentId: string,
		tx?: TransactionContext,
	): Promise<
		{
			unitId: string;
			designationId: string;
		}[]
	> {
		try {
			const query = `
				SELECT recipient_unit_id, addressed_to_designation_id
				FROM document.document_addressee
				WHERE document_id = $1
				ORDER BY recipient_unit_id, addressed_to_designation_id;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [documentId]);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => ({
				unitId: row.recipient_unit_id,
				designationId: row.addressed_to_designation_id,
			}));
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}

	async getDocAddresseeByDocIdSingle(
		documentId: string,
		tx?: TransactionContext,
	): Promise<{
		unitId: string;
		designationId: string;
	}> {
		try {
			const query = `
				SELECT recipient_unit_id, addressed_to_designation_id
				FROM document.document_addressee
				WHERE document_id = $1
				LIMIT 1;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [documentId]);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Document addressee for ${documentId} not found.`,
					},
				);
			}

			return {
				unitId: result.rows[0].recipient_unit_id,
				designationId: result.rows[0].addressed_to_designation_id,
			};
		} catch (error: any) {
			if (error instanceof InfrastructureError) throw error;

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}
}

export default DispatchDocumentAdapter;
