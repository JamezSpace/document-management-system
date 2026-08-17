import type { PostgresDb } from "@fastify/postgres";
import type { DocumentRetentionPolicyPort } from "../../../shared/application/port/intersubsystem/DocumentPolicy.port.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { DocumentRetentionPolicyRepositoryPort } from "../../application/port/repo/DocRetPolicyRepo.port.js";
import DocumentRetentionPolicy from "../../domain/DocumentRetentionPolicy.js";

class DocumentRetentionPolicyAdapter
	implements
		DocumentRetentionPolicyPort,
		DocumentRetentionPolicyRepositoryPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async getRetentionData(documentTypeId: string) {
		try {
			const result = await this.dbPool.query(
				`SELECT id, policy_version, retention_duration, archival_required
            FROM policy.document_retention
            WHERE document_type_id = $1 ORDER BY policy_version DESC`,
				[documentTypeId],
			);
            
			const policyLoadedFromDb = result.rows[0];

			return {
				duration: policyLoadedFromDb.retention_duration,
				archivalRequired: policyLoadedFromDb.archival_required,
				policyVersion: policyLoadedFromDb.policy_version,
                retentionScheduleId: policyLoadedFromDb.id,
			};
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			console.log(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}

	private toDomain(row: any): DocumentRetentionPolicy {
		return new DocumentRetentionPolicy({
			id: row.id,
			archivalRequired: row.archival_required,
			documentTypeId: row.document_type_id,
			effectiveFrom: row.effective_from,
			retentionDuration: row.retention_duration,
			createdAt: row.created_at,
			policyVersion: row.policy_version,
		});
	}

	async save(
		documentRetentionPolicy: DocumentRetentionPolicy,
	): Promise<DocumentRetentionPolicy> {
		try {
			const query = `INSERT INTO policy.document_retention (id, document_type_id,policy_version,retention_duration,archival_required,effective_from)
        VALUES (
            $1, $2, policy.gen_next_policy_version($2), $3, $4, $5
        ) RETURNING id, document_type_id, retention_duration, archival_required, effective_from, created_at, policy_version;`;

			const newPolicy = await this.dbPool.query(query, [
				documentRetentionPolicy.id,
				documentRetentionPolicy.documentTypeId,
				documentRetentionPolicy.retentionDuration,
				documentRetentionPolicy.archivalRequired,
				documentRetentionPolicy.effectiveFrom,
			]);

			return this.toDomain(newPolicy.rows[0]);
		} catch (error: any) {
			const postgresError = mapPostgresError(error);

			console.log(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
				column: postgresError.details?.column,
			});
		}
	}
}

export default DocumentRetentionPolicyAdapter;
