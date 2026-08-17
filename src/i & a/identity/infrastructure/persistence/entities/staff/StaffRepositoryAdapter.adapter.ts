import type { PostgresDb } from "@fastify/postgres";
import type { MediaServicePort } from "../../../../../../shared/application/port/services/mediaService.port.js";
import {
    Category,
    GlobalInfrastructureErrors,
} from "../../../../../../shared/errors/enum/infrastructure.enum.js";
import InfrastructureError from "../../../../../../shared/errors/InfrastructureError.error.js";
import { mapPostgresError } from "../../../../../../shared/infrastructure/persistence/primary/helpers/mapPostgresError.helper.js";
import { transformToCamelCase } from "../../../../../../shared/infrastructure/persistence/primary/helpers/transformToCamelCase.helper.js";
import type { TransactionContext } from "../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type { StaffRepositoryPort } from "../../../../application/ports/repos/entities/staff/StaffRepository.port.js";
import Staff from "../../../../domain/entities/staff/Staff.js";
import AbstractStaffDetails from "../../../../domain/views/staff/AbstractStaffDetails.js";
import StaffDetailsWithMedia from "../../../../domain/views/staff/StaffDetailsWithMedia.js";

class StaffRepositoryAdapter implements StaffRepositoryPort {
	constructor(
		private readonly dbPool: PostgresDb,
		private readonly mediaService: MediaServicePort,
	) {}

	private toStaffDetailsWithMedia(rows: any[]): StaffDetailsWithMedia {
		const baseRow = transformToCamelCase(rows[0]);
		const mediaState = rows.reduce(
			(
				acc: { profilePicUrl: string | null; signatureUrl: string | null },
				row,
			) => {
				const normalized = transformToCamelCase(row);
				const url = this.mediaService.resolveMediaToPublicURL({
					objectKey: normalized.objectKey,
					format: normalized.format,
				});

				if (normalized.assetRole === "PROFILE_PICTURE") {
					acc.profilePicUrl = url;
				}

				if (normalized.assetRole === "SIGNATURE") {
					acc.signatureUrl = url;
				}

				return acc;
			},
			{ profilePicUrl: null, signatureUrl: null },
		);

		return new StaffDetailsWithMedia({
			id: baseRow.id,
			authProviderId: baseRow.apId,
			identityId: baseRow.identityId,
			firstName: baseRow.firstName,
			lastName: baseRow.lastName,
			middleName: baseRow.middleName,
			fullName: baseRow.fullName,
			email: baseRow.email,
			staffNumber: baseRow.staffNumber,
			employmentType: baseRow.employmentType,
			unitId: baseRow.unitId,
			unitSector: baseRow.unitSector,
			unitName: baseRow.unitName,
			officeId: baseRow.officeId,
			officeName: baseRow.officeName,
			designationId: baseRow.designationId,
			designationTitle: baseRow.designationTitle,
			status: baseRow.status,
			createdAt: baseRow.createdAt,
			createdBy: baseRow.createdBy,
			activatedBy: baseRow.activatedBy,
			activatedAt: baseRow.activatedAt,
			updatedAt: baseRow.updatedAt,
			media: mediaState,
		});
	}

	async fetchAll(): Promise<AbstractStaffDetails[]> {
		const query =
			"select * from identity.staff_details where id <> 'staff.system' and status <> 'deleted';";

		const result = await this.dbPool.query(query);

		let staffDetails: AbstractStaffDetails[] = [];
		result.rows.forEach((staffDetail) => {
			let camelCasedStaffDetail = transformToCamelCase(staffDetail);

			const {
				auth_provider_id,
				unitId,
				unitSector,
				unitName,
				officeId,
				officeName,
				designationId,
				designationTitle,
				...restOfStaffDetails
			} = camelCasedStaffDetail;

			let preparedStaffDetail = {
				unit: {
					id: unitId,
					name: unitName,
					sector: unitSector,
				},
				office: {
					id: officeId,
					name: officeName,
				},
				designation: {
					id: designationId,
					title: designationTitle,
				},
				...restOfStaffDetails,
			} as AbstractStaffDetails;

			staffDetails.push(preparedStaffDetail);
		});

		return staffDetails;
	}

	async fetchAllStaffMembersByUnit(
		unitId: string,
	): Promise<AbstractStaffDetails[]> {
		const query =
			"select * from identity.staff_details where unit_id = $1 and status <> 'deleted';";

		const result = await this.dbPool.query(query, [unitId]);

		let staffDetails: AbstractStaffDetails[] = [];
		result.rows.forEach((staffDetail) => {
			let camelCasedStaffDetail = transformToCamelCase(staffDetail);

			const {
				auth_provider_id,
				unitId,
				unitSector,
				unitName,
				officeId,
				officeName,
				designationId,
				designationTitle,
				...restOfStaffDetails
			} = camelCasedStaffDetail;

			let preparedStaffDetail = {
				unit: {
					id: unitId,
					name: unitName,
					sector: unitSector,
				},
				office: {
					id: officeId,
					name: officeName,
				},
				designation: {
					id: designationId,
					title: designationTitle,
				},
				...restOfStaffDetails,
			} as AbstractStaffDetails;

			staffDetails.push(preparedStaffDetail);
		});

		return staffDetails;
	}

	async findStaffByAuthProviderId(
		authProviderId: string,
	): Promise<Staff | null> {
		try {
			const query = "select * from identity.staff where identity_id = $1";

			const result = await this.dbPool.query(query, [authProviderId]);

			if (result.rows.length === 0) {
				return null;
			}

			const staffData = result.rows[0];
			return new Staff({
				id: staffData.id,
				staffNumber: staffData.staff_number,
				employmentType: staffData.employment_type,
				status: staffData.status,
				designationId: staffData.designation_id,
				identityId: staffData.identity_id,
				officeId: staffData.office_id,
				unitId: staffData.unit_id,
				createdAt: staffData.created_at,
				createdBy: staffData.createdBy,
				activatedBy: staffData.activatedBy,
				activatedAt: staffData.activatedAt,
			});
		} catch (error: any) {
			console.log("error fetching staff by id", error);

			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async findStaffWithoutMediaById(staffId: string): Promise<Staff | null> {
		try {
			const query = "SELECT * FROM identity.staff WHERE id = $1";
			const result = await this.dbPool.query(query, [staffId]);

			if (result.rows.length === 0) {
				return null;
			}

			const staffData = result.rows[0];
			return new Staff({
				id: staffData.id,
				staffNumber: staffData.staff_number,
				employmentType: staffData.employment_type,
				status: staffData.status,
				designationId: staffData.designation_id,
				identityId: staffData.identity_id,
				officeId: staffData.office_id,
				unitId: staffData.unit_id,
				createdAt: staffData.created_at,
				createdBy: staffData.createdBy,
				activatedBy: staffData.activatedBy,
				activatedAt: staffData.activatedAt,
			});
		} catch (error: any) {
			console.log("error fetching staff by id", error);

			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async findStaffWithMediaByStaffId(
		staffId: string,
	): Promise<StaffDetailsWithMedia | null> {
		try {
			const query =
				"SELECT * FROM identity.staff_details_with_media WHERE id = $1";
			const result = await this.dbPool.query(query, [staffId]);

			if (result.rows.length === 0) {
				return null;
			}

			return this.toStaffDetailsWithMedia(result.rows);
		} catch (error: any) {
			console.log("error fetching staff details by id", error);

			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async fetchAllStaffWithMedia(): Promise<StaffDetailsWithMedia[]> {
		try {
			const query =
				"SELECT * FROM identity.staff_details_with_media WHERE id <> 'staff.system' and status <> 'deleted'";
			const result = await this.dbPool.query(query);

			if (result.rows.length === 0) {
				return [];
			}

			const grouped = new Map<string, any[]>();

			result.rows.forEach((row) => {
				const staffId = row.id;
				const existing = grouped.get(staffId) ?? [];
				existing.push(row);
				grouped.set(staffId, existing);
			});

			return Array.from(grouped.values()).map((rows) =>
				this.toStaffDetailsWithMedia(rows),
			);
		} catch (error: any) {
			console.log("error fetching staff details with media", error);

			throw new InfrastructureError(
				GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				{
					category: Category.PERSISTENCE,
					message: error.message,
				},
			);
		}
	}

	async deleteStaff(staffId: string): Promise<void> {
		try {
			const query =
				"UPDATE identity.staff SET status = 'deleted' WHERE id = $1 RETURNING id";
			const result = await this.dbPool.query(query, [staffId]);

			if (result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: "No staff record found for deletion",
					},
				);
			}
		} catch (error: any) {
			console.log("error deleting staff", error);

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
				table: postgresError.details?.table,
			});
		}
	}

	async save(staff: Staff, tx?: TransactionContext): Promise<Staff> {
		try {
			const query = `
                INSERT INTO identity.staff (id, identity_id, staff_number, employment_type, unit_id, office_id, designation_id, status, created_at) 
                VALUES ($1, $2, $3, $4,$5,$6,$7,$8, now())
                RETURNING *`;

			const executor = tx?.client ?? this.dbPool;

			const result = await executor.query(query, [
				staff.getStaffId(),
				staff.identityId,
				staff.staffNumber,
				staff.employmentType,
				staff.unitId,
				staff.officeId,
				staff.designationId,
				staff.status,
			]);

			const newStaff = result.rows[0];

			return new Staff({
				id: newStaff.id,
				staffNumber: newStaff.staff_number,
				employmentType: newStaff.employment_type,
				status: newStaff.status,
				designationId: newStaff.designation_id,
				identityId: newStaff.identity_id,
				officeId: newStaff.office_id,
				unitId: newStaff.unit_id,
				createdAt: newStaff.created_at,
				createdBy: newStaff.createdBy,
				activatedBy: newStaff.activatedBy,
				activatedAt: newStaff.activatedAt,
			});
		} catch (error: any) {
			console.log("error in staff repo adapter", error);

			const postgresError = mapPostgresError(error);

			throw new InfrastructureError(postgresError.summary, {
				category: Category.PERSISTENCE,
				message: postgresError.details?.message ?? error.message,
			});
		}
	}

	async updateStaff(
		dataPayload: { staffId: string; changesToMake: Partial<Staff> },
		tx?: TransactionContext,
	): Promise<Staff> {
		try {
			const { staffId, changesToMake } = dataPayload;
			const updates: string[] = [];
			const values: any[] = [];
			let paramCount = 1;

			if (changesToMake.staffNumber !== undefined) {
				updates.push(`staff_number = $${paramCount++}`);
				values.push(changesToMake.staffNumber);
			}
			if (changesToMake.employmentType !== undefined) {
				updates.push(`employment_type = $${paramCount++}`);
				values.push(changesToMake.employmentType);
			}
			if (changesToMake.unitId !== undefined) {
				updates.push(`unit_id = $${paramCount++}`);
				values.push(changesToMake.unitId);
			}
			if (changesToMake.officeId !== undefined) {
				updates.push(`office_id = $${paramCount++}`);
				values.push(changesToMake.officeId);
			}
			if (changesToMake.designationId !== undefined) {
				updates.push(`designation_id = $${paramCount++}`);
				values.push(changesToMake.designationId);
			}
			if (changesToMake.status !== undefined) {
				updates.push(`status = $${paramCount++}`);
				values.push(changesToMake.status);
			}
			if (changesToMake.activatedBy !== undefined) {
				updates.push(`activated_by = $${paramCount++}`);
				values.push(changesToMake.activatedBy);
			}
			if (changesToMake.activatedAt !== undefined) {
				updates.push(`activated_at = $${paramCount++}`);
				values.push(changesToMake.activatedAt);
			}
			if (changesToMake.updatedAt !== undefined) {
				updates.push(`updated_at = $${paramCount++}`);
				values.push(changesToMake.updatedAt);
			}

			if (updates.length === 0) {
				return new Staff({ id: staffId } as any);
			}

			values.push(staffId);
			const query = `UPDATE identity.staff SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;

			const executor = tx?.client ?? this.dbPool;
			const result = await executor.query(query, values);

			if (result.rows.length === 0) {
				throw new InfrastructureError(
					GlobalInfrastructureErrors.persistence.NOT_FOUND,
					{
						category: Category.PERSISTENCE,
						message: "No staff record found for update",
					},
				);
			}

			const updatedStaff = result.rows[0];

			return new Staff({
				id: updatedStaff.id,
				staffNumber: updatedStaff.staff_number,
				employmentType: updatedStaff.employment_type,
				status: updatedStaff.status,
				designationId: updatedStaff.designation_id,
				identityId: updatedStaff.identity_id,
				officeId: updatedStaff.office_id,
				unitId: updatedStaff.unit_id,
				createdAt: updatedStaff.created_at,
				createdBy: updatedStaff.createdBy,
				activatedBy: updatedStaff.activatedBy,
				activatedAt: updatedStaff.activatedAt,
			});
		} catch (error: any) {
			console.log("error updating staff", error);
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

export default StaffRepositoryAdapter;
