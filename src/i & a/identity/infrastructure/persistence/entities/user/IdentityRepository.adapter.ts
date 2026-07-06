import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { IdentityRepositoryPort } from "../../../../application/ports/repos/entities/user/UserRepository.port.js";
import Identity from "../../../../domain/entities/user/Identity.js";
import { IdentityStatus } from "../../../../domain/entities/user/IdentityStatus.js";

class IdentityRepositoryAdapter implements IdentityRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

    // helper function to rehydrate to Identity object
	private toIdentity(row: any): Identity {
		return new Identity({
			id: row.id,
			authProviderId: row.auth_provider_id,
			firstName: row.first_name,
			lastName: row.last_name,
			middleName: row.middle_name,
            phoneNum: row.phone_number,
			email: row.email,
			status: row.status as IdentityStatus,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		});
	}

	async updateIdentityStatus(
		uid: string,
		status: IdentityStatus,
	): Promise<Identity> {
		try {
			const result = await this.dbPool.query(
				"UPDATE identity.users SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, auth_provider_id, first_name, last_name, middle_name, email, phone_number, status, created_at, updated_at",
				[status, uid],
			);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: `Identity with uid ${uid} not found`,
					},
				);
			}

			const row = result.rows[0];

			return this.toIdentity(row);
		} catch (error: any) {
			console.log("error in postgres adapter", error);

            const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async findIdentityByAuthProviderId(
		authProviderId: string,
	): Promise<Identity | null> {
		try {
			const result = await this.dbPool.query(
				"SELECT id, auth_provider_id, first_name, last_name, middle_name, email, phone_number, status FROM identity.users WHERE auth_provider_id = $1 LIMIT 1",
				[authProviderId],
			);

			if (!result.rows || result.rows.length === 0) return null;

			const row = result.rows[0];

			// map DB row to domain
			return this.toIdentity(row);
		} catch (error: any) {
			console.log("error in postgres adapter", error);

            const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async findAllUsers(): Promise<Identity[]> {
		try {
			const result = await this.dbPool.query(
				"SELECT id, auth_provider_id, first_name, last_name, middle_name, email, phone_number, status, created_at, updated_at FROM identity.users ORDER BY created_at DESC",
			);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map((row) => this.toIdentity(row));
		} catch (error: any) {
			console.log("error in identity repo adapter", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async save(payload: {
		authProvider: string;
		identity: Identity;
	}, tx?: TransactionContext): Promise<Identity> {
		try {
            const executor = tx?.client ?? this.dbPool

			const result = await executor.query(
				"INSERT INTO identity.users VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, auth_provider, auth_provider_id, email, first_name, last_name, middle_name, phone_number, status, created_at",
				[
					payload.identity.getUserId(),
					payload.authProvider,
					payload.identity.getAuthProviderId(),
					payload.identity.getEmail(),
					payload.identity.getFirstName(),
					payload.identity.getLastName(),
					payload.identity.getMiddleName(),
                    payload.identity.getPhoneNumber(),
					payload.identity.getStatus(),
					payload.identity.getCreatedAt(),
				],
			);

			return this.toIdentity(result.rows[0]);
		} catch (error: any) {
			console.log("error in identity repo adapter", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}
}

export default IdentityRepositoryAdapter;
