import type { PostgresDb } from "@fastify/postgres";
import { Category, GlobalInfrastructureErrors } from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import type { OnboardingSessionRepositoryPort } from "../../../../application/ports/repos/entities/user/OnboardingSessionRepository.port.js";
import OnboardingSession from "../../../../domain/entities/user/OnboardingSession.js";
import OnboardingSessionView from "../../../../domain/views/invites/OnboardingSessionView.js";

class OnboardingSessionRepositoryAdapter implements OnboardingSessionRepositoryPort {
    constructor(private readonly dbPool: PostgresDb) {}

	private toSession(row: any): OnboardingSession {
		return new OnboardingSession({
			id: row.id,
			inviteId: row.invite_id,
			email: row.email,
			currentStep: row.current_step,
			primaryData: row.primary_data,
			profilePictureMediaId: row.profile_picture_media_id,
			signatureMediaId: row.signature_media_id,
			status: row.status,
			startedAt: row.started_at,
			lastActiveAt: row.last_active_at,
			completedAt: row.completed_at,
		});
	}

	private toSessionView(row: any): OnboardingSessionView {
		return new OnboardingSessionView({
			id: row.id,
			inviteId: row.invite_id,
			email: row.email,
			currentStep: row.current_step,
			primaryData: row.primary_data,
			storageProvider: row.storage_provider,
			profilePictureBucketName: row.profile_picture_bucket_name,
			profilePictureObjectKey: row.profile_picture_object_key,
			profilePictureFormat: row.profile_picture_format,
			signatureBucketName: row.signature_bucket_name,
			signatureObjectKey: row.signature_object_key,
			signatureFormat: row.signature_format,
			status: row.status,
			startedAt: row.started_at,
			lastActiveAt: row.last_active_at,
			completedAt: row.completed_at
		});
	}

	async save(payload: OnboardingSession): Promise<OnboardingSession> {
		try {
			const query = `
				INSERT INTO identity.onboarding_sessions (
					id,
					invite_id,
					email,
					current_step,
					primary_data,
					profile_picture_media_id,
					signature_media_id,
					status,
					started_at,
					last_active_at,
					completed_at
				)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
				RETURNING id, invite_id, email, current_step, primary_data, profile_picture_media_id, signature_media_id, status, started_at, last_active_at, completed_at
			`;

			const result = await this.dbPool.query(query, [
				payload.id,
				payload.inviteId,
				payload.email,
				payload.currentStep,
				payload.primaryData,
				payload.profilePictureMediaId,
				payload.signatureMediaId,
				payload.status,
				payload.startedAt,
				payload.lastActiveAt,
				payload.completedAt,
			]);

			return this.toSession(result.rows[0]);
		} catch (error: any) {
			console.error("Error saving onboarding session", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async findSessionById(sessionId: string): Promise<OnboardingSession | null> {
		try {
			const query =
				"SELECT id, invite_id, email, current_step, primary_data, profile_picture_media_id, signature_media_id, status, started_at, last_active_at, completed_at FROM identity.onboarding_sessions WHERE id = $1 LIMIT 1";
			const result = await this.dbPool.query(query, [sessionId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toSession(result.rows[0]);
		} catch (error: any) {
			console.error("Error fetching onboarding session by id", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async findSessionByInviteId(
		inviteId: string,
	): Promise<OnboardingSession | null> {
		try {
			const query =
				"SELECT id, invite_id, email, current_step, primary_data, profile_picture_media_id, signature_media_id, status, started_at, last_active_at, completed_at FROM identity.onboarding_sessions WHERE invite_id = $1 LIMIT 1";
			const result = await this.dbPool.query(query, [inviteId]);

			if (!result.rows || result.rows.length === 0) return null;

			return this.toSession(result.rows[0]);
		} catch (error: any) {
			console.error("Error fetching onboarding session by invite id", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

	async update(
		sessionId: string,
		payload: Partial<OnboardingSession>,
	): Promise<OnboardingSession> {
		try {
			const updates: string[] = [];
			const values: any[] = [];
			let paramCount = 1;

			if (payload.email !== undefined) {
				updates.push(`email = $${paramCount++}`);
				values.push(payload.email);
			}
			if (payload.currentStep !== undefined) {
				updates.push(`current_step = $${paramCount++}`);
				values.push(payload.currentStep);
			}
			if (payload.primaryData !== undefined) {
				updates.push(`primary_data = $${paramCount++}`);
				values.push(payload.primaryData);
			}
			if (payload.profilePictureMediaId !== undefined) {
				updates.push(`profile_picture_media_id = $${paramCount++}`);
				values.push(payload.profilePictureMediaId);
			}
			if (payload.signatureMediaId !== undefined) {
				updates.push(`signature_media_id = $${paramCount++}`);
				values.push(payload.signatureMediaId);
			}
			if (payload.status !== undefined) {
				updates.push(`status = $${paramCount++}`);
				values.push(payload.status);
			}
			if (payload.lastActiveAt !== undefined) {
				updates.push(`last_active_at = $${paramCount++}`);
				values.push(payload.lastActiveAt);
			}
			if (payload.completedAt !== undefined) {
				updates.push(`completed_at = $${paramCount++}`);
				values.push(payload.completedAt);
			}

			if (updates.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.INVALID_OPERATION,
					{
						category: Category.PERSISTENCE,
						message: "No changes provided for onboarding session update",
					},
				);
			}

			values.push(sessionId);
			const query = `
				UPDATE identity.onboarding_sessions
				SET ${updates.join(", ")}
				WHERE id = $${paramCount}
				RETURNING id, invite_id, email, current_step, primary_data, profile_picture_media_id, signature_media_id, status, started_at, last_active_at, completed_at
			`;

			const result = await this.dbPool.query(query, values);

			if (!result.rows || result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: "Onboarding session not found for update",
					},
				);
			}

			return this.toSession(result.rows[0]);
		} catch (error: any) {
			console.error("Error updating onboarding session", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
	}

    async fetchAll(): Promise<OnboardingSessionView[]> {
        try {
			const query =
				"SELECT * FROM identity.all_onboarding_sessions";

			const result = await this.dbPool.query(query);

			if (!result.rows || result.rows.length === 0) return [];

			return result.rows.map(session => {
                return this.toSessionView(session);
            })
		} catch (error: any) {
			console.error("Error fetching onboarding session by invite id", error);

			const err = mapPostgresError(error);

			throw new InfrastructureError(err.summary, {
				category: Category.PERSISTENCE,
				message: err.details?.message ?? error.message,
				table: err.details?.table,
			});
		}
    }

    async assignOnboardingSessionMedia(
		sessionId: string,
		payload: {
			profilePictureMediaId?: string;
			signatureMediaId?: string;
		},
	): Promise<void> {
		try {
			const updates: string[] = [];
			const values: any[] = [];
			let paramCount = 1;

			if (payload.profilePictureMediaId !== undefined) {
				updates.push(`profile_picture_media_id = $${paramCount++}`);
				values.push(payload.profilePictureMediaId);
			}

			if (payload.signatureMediaId !== undefined) {
				updates.push(`signature_media_id = $${paramCount++}`);
				values.push(payload.signatureMediaId);
			}

			if (updates.length === 0) return;

			values.push(sessionId);

			const query = `
				UPDATE identity.onboarding_sessions
				SET ${updates.join(", ")}
				WHERE id = $${paramCount}
			`;

			await this.dbPool.query(query, values);
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

export default OnboardingSessionRepositoryAdapter;
