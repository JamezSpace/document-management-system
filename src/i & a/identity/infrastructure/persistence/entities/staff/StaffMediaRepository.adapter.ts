import type { PostgresDb } from "@fastify/postgres";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
    SaveStaffMediaPayload,
    StaffMediaRepositoryPort,
} from "../../../../application/ports/repos/entities/media/StaffMediaRepository.port.js";

class StaffMediaRepositoryAdapter implements StaffMediaRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async save(payload: SaveStaffMediaPayload, tx?: TransactionContext): Promise<void> {
		try {
			const query = `
				INSERT INTO identity.staff_media_assets (
					staff_id,
					media_id,
					asset_role,
					is_active,
					assigned_at
				)
				VALUES ($1,$2,$3,$4,$5)
				ON CONFLICT (staff_id, media_id)
				DO UPDATE SET
					asset_role = EXCLUDED.asset_role,
					is_active = EXCLUDED.is_active,
					assigned_at = EXCLUDED.assigned_at
			`;

            const executor = tx?.client ?? this.dbPool

			await executor.query(query, [
				payload.staffId,
				payload.mediaId,
				payload.assetRole,
				payload.isActive ?? false,
				payload.assignedAt ?? new Date(),
			]);
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

	async deactivateByRole(staffId: string, assetRole: string): Promise<void> {
		try {
			const query = `
				UPDATE identity.staff_media_assets
				SET is_active = FALSE
				WHERE staff_id = $1 AND asset_role = $2
			`;

			await this.dbPool.query(query, [staffId, assetRole]);
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

export default StaffMediaRepositoryAdapter;
