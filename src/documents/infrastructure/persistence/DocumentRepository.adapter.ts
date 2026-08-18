import type { PostgresDb } from "@fastify/postgres";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import NexusError from "../../../shared/errors/NexusError.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type { DocumentRepositoryPort } from "../../application/ports/repos/DocumentRepository.port.js";
import type Document from "../../domain/entities/document/Document.js";
import DocumentEntity from "../../domain/entities/document/Document.js";
import DocumentVersion from "../../domain/entities/document/DocumentVersion.js";

class DocumentRepositoryAdapter implements DocumentRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toDomain(row: any, docAddressees?: any[]): Document {
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
            isPrimary: a.is_primary
		}));
        
		return new DocumentEntity({
			id: row.id,
			ownerId: row.owner_id,
			title: row.title,
			version,
			referenceNumber: row.reference_number,

			correspondence: {
				originatingUnitId: row.originating_unit_id,
				subjectCodeId: row.subject_code_id,
				direction: row.direction,
			},

			addressees: docAddressees ? docAddressees : addressees,

			classification: {
				sensitivity: row.sensitivity,
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

	async save(document: Document, tx?: TransactionContext): Promise<Document> {
		try {
			const query = `
				INSERT INTO document.documents (
					id, title, owner_id, reference_number, current_version_id,
					originating_unit_id,  subject_code_id, direction,
					sensitivity, business_function_id, document_type_id,
					classified_by, classified_at, last_reclassified_at, last_reclassified_by,
					policy_version, retention_schedule_id, retention_start_date, disposal_eligibility_date, archival_required,
					created_at, updated_at
				)
				VALUES (
					$1, $2, $3, $4, $5,
					$6, $7, $8,
					$9, $10, $11,
					$12, $13, $14, $15,
					$16, $17, $18, $19, $20,
					now(), null
				)
				RETURNING *;
			`;

			const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(query, [
				document.id,
				document.title,
				document.ownerId,
				document.referenceNumber,
				document.getCurrentVersion()?.id ?? null,
				document.correspondence.originatingUnitId,
				document.correspondence.subjectCodeId,
				document.correspondence.direction,
				document.classification.sensitivity,
				document.classification.functionCodeId,
				document.classification.documentTypeId,
				document.classification.classifiedBy,
				document.classification.classifiedAt,
				document.classification.lastReclassifiedAt ?? null,
				document.classification.lastReclassifiedBy ?? null,
				document.retention.policyVersion,
				document.retention.retentionScheduleId,
				document.retention.retentionStartDate,
				document.retention.disposalEligibilityDate,
				document.retention.archivalRequired,
			]);

			const dbResponse = result.rows[0];

			return this.toDomain(dbResponse, document.addressees);
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

	async findDocumentById(id: string): Promise<Document | null> {
		try {
			const query =
				"SELECT * FROM document.full_document_details WHERE id = $1 LIMIT 1;";

			const result = await this.dbPool.query(query, [id]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toDomain(result.rows[0]);
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async editDocument(
		document: Document,
		tx?: TransactionContext,
	): Promise<Document | null> {
		try {
			const query = `
				UPDATE document.documents
				SET
					title = $2,
					owner_id = $3,
					reference_number = $4,
					current_version_id = $5,
					originating_unit_id = $6,
					subject_code_id = $7,
					sensitivity = $8,
					business_function_id = $9,
					document_type_id = $10,
					classified_by = $11,
					classified_at = $12,
					last_reclassified_at = $13,
					last_reclassified_by = $14,
					policy_version = $15,
					retention_schedule_id = $16,
					retention_start_date = $17,
					disposal_eligibility_date = $18,
					archival_required = $19,
					updated_at = now()
				WHERE id = $1
				RETURNING *;
			`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, [
				document.id,
				document.title,
				document.ownerId,
				document.referenceNumber,
				document.getCurrentVersion()?.id ?? null,
				document.correspondence.originatingUnitId,
				document.correspondence.subjectCodeId,
				document.classification.sensitivity,
				document.classification.functionCodeId,
				document.classification.documentTypeId,
				document.classification.classifiedBy,
				document.classification.classifiedAt,
				document.classification.lastReclassifiedAt ?? null,
				document.classification.lastReclassifiedBy ?? null,
				document.retention.policyVersion,
				document.retention.retentionScheduleId,
				document.retention.retentionStartDate,
				document.retention.disposalEligibilityDate,
				document.retention.archivalRequired,
			]);

            const docAddressees = document.addressees;
			if (!result.rows || result.rows.length === 0) return null;

			return this.toDomain(result.rows[0], docAddressees);
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

	async softDeleteDocument(id: string): Promise<void> {
		await this.dbPool.query(
			"UPDATE document.documents SET updated_at = now() WHERE id = $1;",
			[id],
		);
	}

	async hardDeleteDocument(id: string): Promise<void> {
		await this.dbPool.query(
			"DELETE FROM document.documents WHERE id = $1;",
			[id],
		);
	}

	async fetchDocumentsByStaff(staffId: string): Promise<Document[]> {
		try {
			const query = `
                SELECT * 
                FROM document.full_document_details
                WHERE owner_id = $1;
            `;

			const result = await this.dbPool.query(query, [staffId]);

			if (!result.rows || result.rows.length === 0) return [];          

			return result.rows.map((row) => this.toDomain(row));
		} catch (error: any) {
			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}
}

export default DocumentRepositoryAdapter;
