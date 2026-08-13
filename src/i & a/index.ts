import type { FastifyInstance } from "fastify";
import NodemailerEmailServiceAdapter from "../shared/infrastructure/adapters/services/email/NodemailerEmailService.adapter.js";
import ResendEmailServiceAdapter from "../shared/infrastructure/adapters/services/email/ResendEmailService.adapter.js";
import CloudinaryMediaServiceAdapter from "../shared/infrastructure/adapters/services/media/CloudinaryMediaService.adapter.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import MediaAssetRepositoryAdapter from "../shared/infrastructure/persistence/primary/MediaAssetRepository.adapter.js";
import RecoveryTaskRepositoryAdapter from "../shared/infrastructure/persistence/primary/RecoveryTaskRepository.adapter.js";
import TransactionManager from "../shared/infrastructure/persistence/primary/TransactionManager.js";
import RoleAssignmentController from "./access/api/controllers/RoleAssignment.controller.js";
import roleAssignmentRoutes from "./access/api/routes/roleAssignment.route.js";
import AssignOfficialRoleUseCase from "./access/application/usecases/AssignOfficialRole.js";
import AssignRoleUseCase from "./access/application/usecases/AssignRole.usecase.js";
import DelegateRole from "./access/application/usecases/DelegateRole.usecase.js";
import ListRoleAssignmentsUseCase from "./access/application/usecases/ListRoleAssignments.usecase.js";
import ResolveStaffAuthorityUseCase from "./access/application/usecases/ResolveStaffAuthority.usecase.js";
import RevokeRole from "./access/application/usecases/RevokeRole.js";
import RoleAssignmentRepositoryAdapter from "./access/infrastructure/persistence/RoleAssignmentRepository.adapter.js";
import RoleRepositoryAdapter from "./access/infrastructure/persistence/RoleRepository.adapter.js";
import AccessEventsAdapter from "./access/infrastructure/queue/AccessEvents.adapter.js";
import DesignationController from "./identity/api/controllers/office/Designation.controller.js";
import OfficeController from "./identity/api/controllers/office/Office.controller.js";
import OrgUnitController from "./identity/api/controllers/organizationalUnit/OrganizationUnit.controller.js";
import StaffController from "./identity/api/controllers/staff/Staff.controller.js";
import StaffClassificationController from "./identity/api/controllers/staff/StaffClassification.controller.js";
import AuthenticationController from "./identity/api/controllers/user/Authentication.controller.js";
import InvitesController from "./identity/api/controllers/user/Invites.controller.js";
import officeDesignationRoutes from "./identity/api/routes/office/designation.route.js";
import officeRoutes from "./identity/api/routes/office/office.route.js";
import staffRoutes from "./identity/api/routes/staff/staff.route.js";
import staffClassificationRoutes from "./identity/api/routes/staff/staffClass.route.js";
import orgUnitRoutes from "./identity/api/routes/unit/orgUnits.route.js";
import identityRoutes from "./identity/api/routes/user/identity.route.js";
import inviteRoutes from "./identity/api/routes/user/invites.route.js";
import AddNewDesignationUseCase from "./identity/application/usecases/office/AddNewDesignation.usecase.js";
import AddNewOfficeUseCase from "./identity/application/usecases/office/AddNewOffice.usecase.js";
import GetAllDesignationUseCase from "./identity/application/usecases/office/GetAllDesignations.usecase.js";
import GetAllOfficesUseCase from "./identity/application/usecases/office/GetAllOffices.usecase.js";
import AddNewOrgUnitUseCase from "./identity/application/usecases/organizationalUnit/AddNewOrgUnit.usecase.js";
import GetAllUnitsUseCase from "./identity/application/usecases/organizationalUnit/GetAllUnits.usecase.js";
import ActivateStaffUseCase from "./identity/application/usecases/staff/activateStaff/ActivateStaff.usecase.js";
import ActivationOrchestratorUseCase from "./identity/application/usecases/staff/activateStaff/ActivationOrchestrator.usecase.js";
import AddNewStaffUseCase from "./identity/application/usecases/staff/AddNewStaff.usecase.js";
import CloseStaffClassificationUseCase from "./identity/application/usecases/staff/classification/CloseStaffClassification.usecase.js";
import CreateStaffClassificationUseCase from "./identity/application/usecases/staff/classification/CreateStaffClassification.usecase.js";
import EditStaffClassificationMetadataUseCase from "./identity/application/usecases/staff/classification/EditClassificationMetadata.usecase.js";
import CreateStaffViaInviteUseCase from "./identity/application/usecases/staff/CreateStaffViaInvite.usecase.js";
import DeleteStaffUseCase from "./identity/application/usecases/staff/DeleteStaff.usecase.js";
import EditExistingStaffUseCase from "./identity/application/usecases/staff/EditExistingStaff.usecase.js";
import FetchStaffRecordUsecase from "./identity/application/usecases/staff/FetchStaffRecord.usecase.js";
import GetAllStaffUseCase from "./identity/application/usecases/staff/GetAllStaff.usecase.js";
import ActivatePendingUserUseCase from "./identity/application/usecases/user/ActivatePendingUser.usercase.js";
import AddNewUserUseCase from "./identity/application/usecases/user/AddNewUser.usecase.js";
import AuthenticateUserUseCase from "./identity/application/usecases/user/AuthenticateUser.usecase.js";
import GetAllUsersUseCase from "./identity/application/usecases/user/GetAllUsers.usecase.js";
import CreateInviteUseCase from "./identity/application/usecases/user/invites/CreateInvite.usecase.js";
import GetAllInvitesUecase from "./identity/application/usecases/user/invites/GetAllInvites.usecase.js";
import NudgeInviteUsecase from "./identity/application/usecases/user/invites/NudgeInvite.usecase.js";
import OnboardingInviteUseCase from "./identity/application/usecases/user/invites/OnboardInvite.usecase.js";
import DesignationEventsAdapter from "./identity/infrastructure/events/office/DesignationsEvents.adapter.js";
import OfficeEventsAdapter from "./identity/infrastructure/events/office/OfficeEvents.adapter.js";
import StaffClassEventsAdapter from "./identity/infrastructure/events/staff/StaffClassEventsAdapter.adapter.js";
import StaffEventsAdapter from "./identity/infrastructure/events/staff/StaffEventsAdapter.adapter.js";
import OrgUnitsEventsAdapter from "./identity/infrastructure/events/unit/OrgUnitsEvents.adapter.js";
import IdentityEventsAdapter from "./identity/infrastructure/events/user/IdentityEvents.adapter.js";
import DesignationRepositoryAdapter from "./identity/infrastructure/persistence/entities/designation/DesignationRepository.adapter.js";
import OfficeRepositoryAdapter from "./identity/infrastructure/persistence/entities/office/OfficeRepository.adapter.js";
import StaffActivationFailureRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/StaffActivationFailureRepository.adapter.js";
import StaffCapabilityClassRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/StaffCapabilityClassRepository.adapter.js";
import StaffClassificationRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/StaffClassificationRepositoryAdapter.adapter.js";
import StaffMediaRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/StaffMediaRepository.adapter.js";
import StaffRepositoryAdapter from "./identity/infrastructure/persistence/entities/staff/StaffRepositoryAdapter.adapter.js";
import OrgUnitRepositoryAdapter from "./identity/infrastructure/persistence/entities/unit/OrgUnitRepository.adapter.js";
import IdentityRepositoryAdapter from "./identity/infrastructure/persistence/entities/user/IdentityRepository.adapter.js";
import OnboardingSessionRepositoryAdapter from "./identity/infrastructure/persistence/entities/user/OnboardingSessionRepository.adapter.js";
import InviteRepositoryAdapter from "./identity/infrastructure/persistence/entities/user/InviteRepository.adapter.js";
import CapRoleRepositoryAdapter from "./identity/infrastructure/persistence/mappings/CapRoleRepository.adapter.js";
import DesigCapClassRepositoryAdapter from "./identity/infrastructure/persistence/mappings/DesigCapClassRepository.adapter.js";
import OfficeDesignationRepositoryAdapter from "./identity/infrastructure/persistence/mappings/OfficeDesignationRepository.adapter.js";
import FirebaseAuthAdapter from "./identity/infrastructure/services/auth/FirebaseAuth.adapter.js";
import ClassificationServiceAdapter from "./identity/infrastructure/services/ClassificationService.adapter.js";
import IdentityEmailServiceAdapter from "./identity/infrastructure/services/EmailService.adapter.js";
import OpaqueTokenServiceAdapter from "./identity/infrastructure/services/OpaqueTokenService.adapter.js";
import RoleServiceAdapter from "./identity/infrastructure/services/RoleService.adapter.js";


export default async function IdentityAccessSubsystem(
	fastify: FastifyInstance
) {
	// infrastructure Layer
	const postgres = fastify.pg;

	const globalEventBus = new InMemoryEventBusAdapter();
	const globalResendEmailService = new ResendEmailServiceAdapter();
	const idGenerator = new UuidV7Generator();
	const transactionManager = new TransactionManager(postgres);
	const mediaService = new CloudinaryMediaServiceAdapter();

	// all module repos in identity subsystem
	const identityRepository = new IdentityRepositoryAdapter(postgres);
	const inviteRepository = new InviteRepositoryAdapter(postgres);
    const onboardingSessionRepo = new OnboardingSessionRepositoryAdapter(postgres);
	const orgUnitRepository = new OrgUnitRepositoryAdapter(postgres);
	const roleRepository = new RoleRepositoryAdapter(postgres);
	const roleAssignmentsRepository = new RoleAssignmentRepositoryAdapter(postgres);
	const officeRepository = new OfficeRepositoryAdapter(postgres);
	const designationRepository = new DesignationRepositoryAdapter(postgres);
	const officeDesignationRepository =
		new OfficeDesignationRepositoryAdapter(postgres);
	const staffRepositoryAdapter = new StaffRepositoryAdapter(
		postgres,
		mediaService,
	);
	const staffMediaRepository = new StaffMediaRepositoryAdapter(postgres);
	const staffClassificationRepository =
		new StaffClassificationRepositoryAdapter(postgres);
	const staffCapabilityClassRepository =
		new StaffCapabilityClassRepositoryAdapter(postgres);
    const desigCapClassRepository = new DesigCapClassRepositoryAdapter(postgres);
    const capRoleRepository = new CapRoleRepositoryAdapter(postgres);
	const mediaAssetRepository = new MediaAssetRepositoryAdapter(postgres);
	const staffMediaAssetRepository = new StaffMediaRepositoryAdapter(postgres);
    const activationFailureRepository = new StaffActivationFailureRepositoryAdapter(postgres);
	const recoveryTaskRepository = new RecoveryTaskRepositoryAdapter(postgres);

	//  all module event adapters in identity subsystem
	const accessEventsAdapter = new AccessEventsAdapter(globalEventBus);
	const identityEventsAdapter = new IdentityEventsAdapter(globalEventBus);
	const unitEventsAdapter = new OrgUnitsEventsAdapter(globalEventBus);
	const officeEventsAdapter = new OfficeEventsAdapter(globalEventBus);
	const designationEventsAdapter = new DesignationEventsAdapter(
		globalEventBus,
	);
	const staffEventsAdapter = new StaffEventsAdapter(globalEventBus);
	const staffClassificationEventsAdapter = new StaffClassEventsAdapter(globalEventBus);

	// service layer
	const identityEmailService = new IdentityEmailServiceAdapter(globalResendEmailService);

    const tokenService = new OpaqueTokenServiceAdapter();
	const cloudinaryMediaService = new CloudinaryMediaServiceAdapter();
	const classificationService = new ClassificationServiceAdapter(desigCapClassRepository);
	const roleService = new RoleServiceAdapter(capRoleRepository, roleRepository);

	// application Layer
	const authenticateUserUseCase = new AuthenticateUserUseCase(
		identityRepository,
		identityEventsAdapter,
	);

	const addNewUserUseCase = new AddNewUserUseCase(
		idGenerator,
		identityEventsAdapter,
		identityRepository,
	);

	const getAllUsersUseCase = new GetAllUsersUseCase(identityRepository);

    const createInviteUsecase = new CreateInviteUseCase(idGenerator, tokenService, identityEmailService, inviteRepository);
    const getAllInvitesUsecase = new GetAllInvitesUecase(inviteRepository);
    const nudgeInviteUsecase = new NudgeInviteUsecase(identityEmailService, inviteRepository, onboardingSessionRepo);

	const onboardInviteUseCase = new OnboardingInviteUseCase(
        idGenerator,
		tokenService,
		cloudinaryMediaService,
		mediaAssetRepository,
        inviteRepository,
        onboardingSessionRepo
	);

	const activatePendingUserUseCase = new ActivatePendingUserUseCase(
		identityEventsAdapter,
		identityRepository,
	);

	// application layer - organizational unit
	const addNewOrgUnitUseCase = new AddNewOrgUnitUseCase(
		idGenerator,
		unitEventsAdapter,
		orgUnitRepository,
	);

	const getAllOrgUnitsUseCase = new GetAllUnitsUseCase(orgUnitRepository);

	// application layer - office
	const addNewOfficeUseCase = new AddNewOfficeUseCase(
		idGenerator,
		officeEventsAdapter,
		officeRepository,
	);

	const getAllOfficesUseCase = new GetAllOfficesUseCase(officeRepository);

	// application layer - office designation
	const addNewDesignationUseCase = new AddNewDesignationUseCase(
		idGenerator,
		designationEventsAdapter,
		designationRepository,
	);

	const getAllDesignationUseCase = new GetAllDesignationUseCase(
		designationRepository,
	);

	// application layer - staff
	const getAllStaffUseCase = new GetAllStaffUseCase(staffRepositoryAdapter);

	const editStaffUseCase = new EditExistingStaffUseCase(
		staffEventsAdapter,
		staffRepositoryAdapter,
	);
	const deleteStaffUseCase = new DeleteStaffUseCase(staffRepositoryAdapter);

	const addNewStaffUseCase = new AddNewStaffUseCase(
		idGenerator,
		staffEventsAdapter,
		staffRepositoryAdapter,
	);

	const assignOfficialRoleUseCase = new AssignOfficialRoleUseCase(
		accessEventsAdapter,
		roleAssignmentsRepository,
		idGenerator,
	);
	const assignRoleUseCase = new AssignRoleUseCase(
		idGenerator,
		roleRepository,
		roleAssignmentsRepository,
		accessEventsAdapter,
	);
	const delegateRoleUseCase = new DelegateRole(
		accessEventsAdapter,
		roleAssignmentsRepository,
		idGenerator,
		transactionManager,
	);
	const revokeRoleUseCase = new RevokeRole(
		accessEventsAdapter,
		roleAssignmentsRepository,
		transactionManager,
	);
	const listRoleAssignmentsUseCase = new ListRoleAssignmentsUseCase(
		roleAssignmentsRepository,
	);

	const activateStaffUseCase = new ActivateStaffUseCase(
		idGenerator,
		staffRepositoryAdapter,
		officeDesignationRepository,
		onboardingSessionRepo,
		staffClassificationRepository,
		staffMediaAssetRepository,
		staffEventsAdapter,
		classificationService,
		roleService,
		transactionManager,
        assignOfficialRoleUseCase
	);

    const activationOrchestratorUseCase =
	new ActivationOrchestratorUseCase(
		activateStaffUseCase,
		activationFailureRepository,
		staffEventsAdapter,
		idGenerator
	);

	const createStaffViaInviteUseCase = new CreateStaffViaInviteUseCase(
		idGenerator,
		identityEventsAdapter,
		staffEventsAdapter,
		identityRepository,
		inviteRepository,
		onboardingSessionRepo,
		recoveryTaskRepository,
		addNewStaffUseCase,
		new FirebaseAuthAdapter(),
		identityEmailService,
		transactionManager,
	);

	const fetchStaffUseCase = new FetchStaffRecordUsecase(staffRepositoryAdapter);

	// application layer - staff classification
	const createStaffClassificationUseCase =
		new CreateStaffClassificationUseCase(
			idGenerator,
			staffClassificationEventsAdapter,
			staffClassificationRepository,
		);

	const editStaffClassificationMetadataUseCase =
		new EditStaffClassificationMetadataUseCase(
			staffClassificationEventsAdapter,
			staffClassificationRepository,
		);

	const closeStaffClassificationUseCase = new CloseStaffClassificationUseCase(
		staffClassificationEventsAdapter,
		staffClassificationRepository,
	);

    const resolveStaffAuthority = new ResolveStaffAuthorityUseCase(roleAssignmentsRepository);

	// controller Layer
	const authenticationController = new AuthenticationController(
        onboardInviteUseCase,
		authenticateUserUseCase,
		addNewUserUseCase,
		activatePendingUserUseCase,
		getAllUsersUseCase,
	);

    const invitesController = new InvitesController(createInviteUsecase, getAllInvitesUsecase, nudgeInviteUsecase);

	const roleAssignmentController = new RoleAssignmentController(
		assignRoleUseCase,
		delegateRoleUseCase,
		revokeRoleUseCase,
		listRoleAssignmentsUseCase,
	);

	const orgUnitController = new OrgUnitController(
		addNewOrgUnitUseCase,
		getAllOrgUnitsUseCase,
	);

	const officeController = new OfficeController(
		addNewOfficeUseCase,
		getAllOfficesUseCase,
	);

	const officeDesignationController = new DesignationController(
		addNewDesignationUseCase,
		getAllDesignationUseCase,
	);

	const staffController = new StaffController(
		getAllStaffUseCase,
		createStaffViaInviteUseCase,
		activationOrchestratorUseCase,
		editStaffUseCase,
		deleteStaffUseCase,
		fetchStaffUseCase,
        resolveStaffAuthority
	);

	const staffClassificationController = new StaffClassificationController(
		createStaffClassificationUseCase,
		editStaffClassificationMetadataUseCase,
		closeStaffClassificationUseCase,
	);

	await fastify.register(identityRoutes, {
		controller: authenticationController
	});

	await fastify.register(inviteRoutes, {
		controller: invitesController
	});

	await fastify.register(orgUnitRoutes, {
		controller: orgUnitController
	});

	await fastify.register(officeRoutes, {
		controller: officeController
	});

	await fastify.register(officeDesignationRoutes, {
		controller: officeDesignationController
	});

	await fastify.register(staffRoutes, {
		controller: staffController
	});

	await fastify.register(staffClassificationRoutes, {
		controller: staffClassificationController
	});

	await fastify.register(roleAssignmentRoutes, {
		controller: roleAssignmentController,
	});
}
