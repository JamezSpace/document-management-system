import type { PostgresDb } from "@fastify/postgres";
import type { WorkflowPolicyPort } from "../../../shared/application/port/intersubsystem/WorkflowPolicy.port.js";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import { Category } from "../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type WorkflowStep from "../../../workflow/domain/entities/WorkflowStep.js";
import WorkflowStepEntity from "../../../workflow/domain/entities/WorkflowStep.js";

class WorkflowPolicyAdapter implements WorkflowPolicyPort{
    constructor(private readonly dbPool: PostgresDb) {}

    async getApprovalSteps(documentId: string, tx?: TransactionContext): Promise<WorkflowStep[]> {
		try {
			const query = `
				SELECT
					steps.step_order,
					roles.name AS role,
					steps.resolution_strategy
				FROM document.documents doc
				INNER JOIN policy.approval_workflow_steps steps
					ON steps.document_type_id = doc.document_type_id
					AND steps.policy_version = doc.policy_version
				INNER JOIN identity.roles roles
					ON roles.id = steps.role_id
				WHERE doc.id = $1
				ORDER BY steps.step_order ASC;
			`;

            
            const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(query, [documentId]);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map(
				(row) =>
					new WorkflowStepEntity({
						stepOrder: row.step_order,
						role: row.role,
						resolutionStrategy: row.resolution_strategy,
					}),
			);
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

export default WorkflowPolicyAdapter;
