import type { RecoveryTaskRepositoryPort } from "../../../../../shared/application/port/repos/RecoveryTask.port.js";
import type { IdGeneratorPort } from "../../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../../shared/application/port/TransactionManager.port.js";
import { RecoveryTaskType } from "../../../../../shared/domain/RecoveryTask.js";
import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import Identity from "../../../domain/entities/user/Identity.js";
import { IdentityStatus } from "../../../domain/entities/user/IdentityStatus.js";
import { OnboardingSessionStatus } from "../../../domain/enum/onboardingSessionStatus.enum.js";
import { InviteStatus, Status } from "../../../domain/enum/staff.enum.js";
import type { StaffEventsPort } from "../../ports/events/staff/StaffEvent.port.js";
import type { UserEventsPort } from "../../ports/events/user/UserEvents.port.js";
import type { InviteRepositoryPort } from "../../ports/repos/entities/user/InviteRepository.port.js";
import type { OnboardingSessionRepositoryPort } from "../../ports/repos/entities/user/OnboardingSessionRepository.port.js";
import type { IdentityRepositoryPort } from "../../ports/repos/entities/user/UserRepository.port.js";
import type { AuthServicePort } from "../../ports/services/AuthService.port.js";
import type { IdentityEmailServicePort } from "../../ports/services/EmailService.port.js";
import { generateActivationSuccessTemplate } from "../../templates/ActivatedInvite.template.js";
import type AddNewStaffUseCase from "./AddNewStaff.usecase.js";

class CreateStaffViaInviteUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly identityEvents: UserEventsPort,
		private readonly staffEvents: StaffEventsPort,
		private readonly identityRepo: IdentityRepositoryPort,
		private readonly inviteRepo: InviteRepositoryPort,
		private readonly onboardingSessionRepo: OnboardingSessionRepositoryPort,
        private readonly recoveryTaskRepo: RecoveryTaskRepositoryPort,
		private readonly addNewStaffUsecase: AddNewStaffUseCase,
		private readonly authService: AuthServicePort,
		private readonly emailService: IdentityEmailServicePort,
		private readonly transactionManager: TransactionManager,
	) {}

	async execute(inviteId: string, activatorId: string) {
		// get invite
		const invite = await this.inviteRepo.findById(inviteId),
			onboardingSession =
				await this.onboardingSessionRepo.findSessionByInviteId(
					inviteId,
				);

		if (
			!invite ||
			!onboardingSession ||
			(invite.status !== InviteStatus.ACCEPTED &&
				onboardingSession.status !== OnboardingSessionStatus.COMPLETED)
		)
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Cannot Activate!",
			});

		if (!onboardingSession.primaryData)
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: "Cannot activate invite without primary details",
			});

		const staffDetails = onboardingSession.primaryData;
		const staffEmail = staffDetails.email;

		// create auth user (Firebase)
		const { authProviderId } =
			await this.authService.createUser(staffEmail);

		// using transaction to ensure atomicity
		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				// create Identity
				const userId = "USER-" + this.idGenerator.generate();

				const identity = new Identity({
					id: userId,
					authProviderId,
					email: staffDetails.email,
					phoneNum: staffDetails.phoneNumber,
					status: IdentityStatus.ACTIVE,
					firstName: staffDetails.firstName,
					lastName: staffDetails.lastName,
					middleName: staffDetails.middleName,
				});

				const newUserIdentity = await this.identityRepo.save(
					{
						authProvider: "firebase",
						identity,
					},
					transactionInstance,
				);

				const identityId = newUserIdentity.getUserId();

				if (newUserIdentity)
					await this.identityEvents.userCreated({
						userId: identityId,
					});

				const dateNow = new Date();

				// create Staff
				const newStaff = await this.addNewStaffUsecase.execute(
					{
						identityId,
						staffNumber: staffDetails.staffId,
						employmentType: invite.employmentType,
						unitId: invite.unitId,
						officeId: invite.officeId,
						designationId: invite.designationId,
						status: Status.PENDING,
						createdBy: invite.invitedBy,
						activatedBy: activatorId,
						activatedAt: dateNow,
						createdAt: dateNow,
					},
					transactionInstance,
				);

				const newStaffId = newStaff.getStaffId();
				return { newStaffId };
			},
		);

		const { newStaffId } = result;

		// the preceding tag is "STAFF-" which makes for the start of the slicing to be index 5
		const staffIdWithoutThePrecedingTag = newStaffId.slice(6);
		const inviteIdWithoutThePrecedingTag = inviteId.slice(7);

		const passwordResetLink =
			await this.authService.generatePasswordSetupLink(
				staffDetails.email,
				{
					staffId: staffIdWithoutThePrecedingTag,
					inviteId: inviteIdWithoutThePrecedingTag,
				},
			);

		// notify user
		try {
			await this.emailService.notifyInviteOfSuccessfulAccountActivation(
				staffDetails.email,
				generateActivationSuccessTemplate(passwordResetLink),
			);
		} catch (error: any) {
			await this.recoveryTaskRepo.save({
				id: `RCV-${this.idGenerator.generate()}`,
				taskType: RecoveryTaskType.EMAIL_DELIVERY,
				entityId: newStaffId,
				payload: {
					inviteId,
					staffId: newStaffId,
					email: staffDetails.email,
					type: "activation_email",
				},
				errorMessage: error.message,
				createdAt: new Date(),
			});

			console.error(
				`Email failed but staff was created successfully: ${newStaffId}`,
			);
		}

		// audit log
		await this.staffEvents.staffAdded({
			staffId: newStaffId,
		});

		return { staffId: newStaffId };
	}
}

export default CreateStaffViaInviteUseCase;
