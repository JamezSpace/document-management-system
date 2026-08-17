import type { PostgresDb } from "@fastify/postgres";
import type {
    DocumentView,
    WorkflowDocumentPort,
} from "../../../shared/application/port/intersubsystem/WorkflowDocument.port.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";

class WorkflowDocumentAdapter implements WorkflowDocumentPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toInterface(row: any): DocumentView {
		return {
			docId: row.id,
			owner: {
				id: row.owner_id,
				unitId: row.owner_unit_id,
				officeId: row.owner_office_id,
				designationId: row.owner_designation_id ?? null,
			},
		};
	}

	async getDocumentById(
		documentId: string,
		tx?: TransactionContext,
	): Promise<DocumentView> {
		try {
			const query = `
				SELECT * FROM document.workflow_document_view WHERE id = $1;
			`;

			const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(query, [documentId]);

			return this.toInterface(result.rows[0]);
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
}

export default WorkflowDocumentAdapter;
