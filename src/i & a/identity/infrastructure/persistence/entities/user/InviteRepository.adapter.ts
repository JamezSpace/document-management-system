import type { PostgresDb } from "@fastify/postgres";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import { transformToCamelCase } from "../../../../../../shared/infrastructure/persistence/primary/helpers/transformToCamelCase.helper.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { InviteRepositoryPort } from "../../../../application/ports/repos/entities/user/InviteRepository.port.js";
import Invite, {
    type InvitePayload,
} from "../../../../domain/entities/user/Invite.js";
import type { InvitesView } from "../../../../domain/views/invites/InvitesView.js";

class InviteRepositoryAdapter implements InviteRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	private toInvite(row: any): Invite {
		return new Invite({
			id: row.id,
			email: row.email,
			designationId: row.designation_id,
			unitId: row.unit_id,
			invitedBy: row.invited_by,
			officeId: row.office_id,
			token: row.token,
			isUsed: row.is_used,
			expiresAt: row.expires_at,
			status: row.status,
			acceptedAt: row.accepted_at,
			employmentType: row.employment_type,
			createdAt: row.created_at,
			rejectedAt: row.rejected_at,
			updatedAt: row.updated_at,
		});
	}

	async save(payload: InvitePayload): Promise<Invite> {
		try {
			const result = await this.dbPool.query(
				"INSERT INTO identity.invites VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id, email, unit_id, office_id, designation_id, employment_type, invited_by, token, is_used, expires_at, accepted_at, rejected_at, status, created_at, updated_at",
				[
					payload.id,
					payload.email,
					payload.unitId,
					payload.officeId,
					payload.designationId,
					payload.employmentType,
					payload.invitedBy,
					payload.token,
					payload.isUsed,
					payload.expiresAt,
					payload.acceptedAt,
					payload.rejectedAt,
					payload.status,
					payload.createdAt,
					payload.updatedAt,
				],
			);

			return this.toInvite(result.rows[0]);
		} catch (error: any) {
			console.log("error in invite repo adapter", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async findByToken(token: string): Promise<Invite | null> {
		try {
			const result = await this.dbPool.query(
				"SELECT id, email, unit_id, office_id, designation_id, employment_type, invited_by, token, is_used, expires_at, accepted_at, rejected_at, status, created_at, updated_at FROM identity.invites WHERE token = $1 LIMIT 1",
				[token],
			);

			if (!result.rows || result.rows.length === 0) return null;

			const row = result.rows[0];

			return this.toInvite(row);
		} catch (error: any) {
			console.log("error in postgres adapter", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});

			return null;
		}
	}

	async findById(
		inviteId: string,
		tx?: TransactionContext,
	): Promise<Invite | null> {
		try {
			const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(
				"SELECT id, email, unit_id, office_id, designation_id, employment_type, invited_by, token, is_used, expires_at, accepted_at, rejected_at, status, created_at, updated_at FROM identity.invites WHERE id = $1 LIMIT 1",
				[inviteId],
			);

			if (!result.rows || result.rows.length === 0) return null;

			const row = result.rows[0];

			return this.toInvite(row);
		} catch (error: any) {
			console.log("error in postgres adapter", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});

			return null;
		}
	}

	async fetchAll(): Promise<InvitesView[]> {
		const query = `
        SELECT *
        FROM identity.all_invites;
    `;

		const result = await this.dbPool.query(query);

		return result.rows.map((row) =>
			transformToCamelCase(row),
		) as InvitesView[];
	}

	async update(inviteId: string, payload: Partial<Invite>): Promise<Invite> {
		try {
			const updates: string[] = [];
			const values: any[] = [];
			let paramCount = 1;

			if (payload.email !== undefined) {
				updates.push(`email = $${paramCount++}`);
				values.push(payload.email);
			}
			if (payload.unitId !== undefined) {
				updates.push(`unit_id = $${paramCount++}`);
				values.push(payload.unitId);
			}
			if (payload.officeId !== undefined) {
				updates.push(`office_id = $${paramCount++}`);
				values.push(payload.officeId);
			}
			if (payload.designationId !== undefined) {
				updates.push(`designation_id = $${paramCount++}`);
				values.push(payload.designationId);
			}
			if (payload.employmentType !== undefined) {
				updates.push(`employment_type = $${paramCount++}`);
				values.push(payload.employmentType);
			}
			if (payload.invitedBy !== undefined) {
				updates.push(`invited_by = $${paramCount++}`);
				values.push(payload.invitedBy);
			}
			if (payload.token !== undefined) {
				updates.push(`token = $${paramCount++}`);
				values.push(payload.token);
			}
			if (payload.isUsed !== undefined) {
				updates.push(`is_used = $${paramCount++}`);
				values.push(payload.isUsed);
			}
			if (payload.expiresAt !== undefined) {
				updates.push(`expires_at = $${paramCount++}`);
				values.push(payload.expiresAt);
			}
			if (payload.acceptedAt !== undefined) {
				updates.push(`accepted_at = $${paramCount++}`);
				values.push(payload.acceptedAt);
			}
			if (payload.rejectedAt !== undefined) {
				updates.push(`rejected_at = $${paramCount++}`);
				values.push(payload.rejectedAt);
			}
			if (payload.status !== undefined) {
				updates.push(`status = $${paramCount++}`);
				values.push(payload.status);
			}
			if (payload.updatedAt !== undefined) {
				updates.push(`updated_at = $${paramCount++}`);
				values.push(payload.updatedAt);
			} else if (updates.length > 0) {
				updates.push(`updated_at = NOW()`);
			}

			if (updates.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.INVALID_OPERATION,
					{
						category: Category.PERSISTENCE,
						message: "No changes provided for invite update",
					},
				);
			}

			values.push(inviteId);
			const query = `
				UPDATE identity.invites
				SET ${updates.join(", ")}
				WHERE id = $${paramCount}
				RETURNING id, email, unit_id, office_id, designation_id, employment_type, invited_by, token, expires_at, accepted_at, rejected_at, status, created_at, updated_at
			`;

			const result = await this.dbPool.query(query, values);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: "Invite not found for update",
					},
				);
			}

			return this.toInvite(result.rows[0]);
		} catch (error: any) {
			console.log("error updating invite", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}
}

export default InviteRepositoryAdapter;
