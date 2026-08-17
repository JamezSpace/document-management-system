import type { TransactionManager } from "../../../../../../shared/application/port/TransactionManager.port.js";
import type { IdGeneratorPort } from "../../../../../../shared/application/port/services/IdGenerator.port.js";
import ApplicationError from "../../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../../shared/errors/enum/application.enum.js";
import type AssignOfficialRoleUseCase from "../../../../../access/application/usecases/AssignOfficialRole.js";
import StaffClassification from "../../../../domain/entities/staff/StaffClassification.js";
import { OnboardingSessionStatus } from "../../../../domain/enum/onboardingSessionStatus.enum.js";
import { Status } from "../../../../domain/enum/staff.enum.js";
import type { StaffEventsPort } from "../../../ports/events/staff/StaffEvent.port.js";
import type { StaffMediaRepositoryPort } from "../../../ports/repos/entities/media/StaffMediaRepository.port.js";
import type { DesignationRepositoryPort } from "../../../ports/repos/entities/designation/DesignationRepository.port.js";
import type { StaffClassificationRepositoryPort } from "../../../ports/repos/entities/staff/StaffClassificationRepository.port.js";
import type { StaffRepositoryPort } from "../../../ports/repos/entities/staff/StaffRepository.port.js";
import type { OnboardingSessionRepositoryPort } from "../../../ports/repos/entities/user/OnboardingSessionRepository.port.js";
import type { ClassificationServicePort } from "../../../ports/services/ClassificationService.port.js";
import type { RoleServicePort } from "../../../ports/services/RoleService.port.js";
import type { OfficeDesignationRepositoryPort } from "../../../ports/repos/mappings/OfficeDesignationRepository.port.js";

class ActivateStaffUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly staffRepo: StaffRepositoryPort,
		private readonly officeDesignationRepo: OfficeDesignationRepositoryPort,
		private readonly sessionRepo: OnboardingSessionRepositoryPort,
		private readonly staffClassificationRepo: StaffClassificationRepositoryPort,
		private readonly staffMediaRepo: StaffMediaRepositoryPort,
		private readonly staffEvents: StaffEventsPort,
		private readonly classificationService: ClassificationServicePort,
		private readonly roleService: RoleServicePort,
		private readonly transactionManager: TransactionManager,
        private readonly assignOfficialRole: AssignOfficialRoleUseCase
	) {}

	async execute(staffId: string, inviteId: string) {
		const staff = await this.staffRepo.findStaffWithoutMediaById(staffId);
        
		if (!staff) {
            throw new ApplicationError(ApplicationErrorEnum.STAFF_NOT_FOUND, {
                message: `Staff with id ${staffId} not found.`,
			});
		}

		if (staff.status !== Status.PENDING) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Only a pending staff account can be activated.",
			});
		}
        
        const session = await this.sessionRepo.findSessionByInviteId(inviteId);
        
		if (!session) {
			throw new ApplicationError(ApplicationErrorEnum.SESSION_NOT_FOUND, {
				message: `Session with invite id ${inviteId} not found.`,
			});
		}

		if (
			session.status !== OnboardingSessionStatus.COMPLETED ||
			!session.primaryData ||
			session.primaryData.staffId !== staff.staffNumber ||
			!session.profilePictureMediaId ||
			!session.signatureMediaId
		) {
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "The completed onboarding session does not belong to this staff account.",
			});
		}

		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				await this.staffMediaRepo.save(
					{
						staffId,
						assetRole: "PROFILE_PICTURE",
						mediaId: session.profilePictureMediaId!,
						assignedAt: new Date(),
						isActive: true,
					},
					transactionInstance,
				);

				await this.staffMediaRepo.save(
					{
						staffId,
						assetRole: "SIGNATURE",
						mediaId: session.signatureMediaId!,
						assignedAt: new Date(),
						isActive: true,
					},
					transactionInstance,
				);

                // fetch designation
				const officeDesignation = await this.officeDesignationRepo.findDesignationWithinAnOffice({
                    designationId: staff.designationId,
                    officeId: staff.officeId
                }, transactionInstance);
                

				if (!officeDesignation) {
					throw new ApplicationError(ApplicationErrorEnum.DESIGNATION_NOT_FOUND, {
						message: `Designation with id ${staff.designationId} not found within office with id ${staff.officeId}.`,
					});
				}

                // fetch default capability class from designation
				const capabilityClass =
					await this.classificationService.getDefaultCapabilityClassFromDesignation(
						staff.designationId,
                        transactionInstance
					);

				if (!capabilityClass) {
					throw new Error(
						`No default capability class mapped for designation ${staff.designationId}`,
					);
				}
                const capClassId = capabilityClass.getStaffCapabilityClassId();
				const baseRole = await this.roleService.getRoleByName(
					"staff_member",
				);

				if (!baseRole) {
					throw new Error("Base role for 'staff_member' not found");
				}

                // classify staff
                const activatedAt = new Date();
				const classificationId = `STAFF-CLASS-${this.idGenerator.generate()}`;
				const staffClassification = new StaffClassification({
					id: classificationId,
					staffId,
					capabilityClass: capClassId,
					authorityLevel: officeDesignation.hierarchyLevel,
					effectiveFrom: activatedAt,
				});

				await this.staffClassificationRepo.save(
					staffClassification,
					transactionInstance,
				);

				await this.assignOfficialRole.execute(
					{
						staffId,
						role: baseRole,
						scope: { type: "organization", id: null },
						assignedBy: "staff.system",
						validFrom: activatedAt,
					},
					transactionInstance,
				);


                // derive roles
                const roles = await this.roleService.getRolesFromCapability(
					capClassId,
					transactionInstance,
				);

                for (const role of roles) {
                    if (role.getId() === baseRole.getId()) {
                        continue;
                    }
					await this.assignOfficialRole.execute(
						{
							staffId,
							role,
							scope: { type: "unit", id: staff.unitId },
							assignedBy: "staff.system",
							validFrom: activatedAt,
						},
						transactionInstance,
					);
                }

				const activatedStaff = await this.staffRepo.updateStaff(
					{
						staffId,
						changesToMake: {
							status: Status.ACTIVE,
							activatedAt,
							activatedBy: staffId,
							updatedAt: activatedAt,
						},
					},
					transactionInstance,
				);

				return {
					staffId: activatedStaff.getStaffId(),
					status: activatedStaff.status,
				};
			},
		);

		await this.staffEvents.staffActivated({
			staffId: result.staffId,
		});

		return result;
	}
}

export default ActivateStaffUseCase;
