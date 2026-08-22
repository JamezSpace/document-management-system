import type { FastifyInstance } from "fastify";
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import TransactionManager from "../shared/infrastructure/persistence/primary/TransactionManager.js";
import BusinessFunctionController from "./api/controllers/businessFunction/BusinessFunctionController.js";
import CorrespondenceSubjectController from "./api/controllers/correspondenceSubject/CorrespondenceSubjectController.js";
import DocumentController from "./api/controllers/document/DocumentController.js";
import DocumentTypeController from "./api/controllers/documentType/DocumentTypeController.js";
import MinuteController from "./api/controllers/minute/MinuteController.js";
import businessFunctionRoutes from "./api/routes/bussFunction.route.js";
import correspondenceSubjectRoutes from "./api/routes/corrSubject.route.js";
import documentTypeRoutes from "./api/routes/docType.route.js";
import documentRoutes from "./api/routes/documents.route.js";
import minuteRoutes from "./api/routes/minute.route.js";
import type { RetentionServicePort } from "./application/ports/services/RetentionService.port.js";
import CreateBusinessFunctionUseCase from "./application/usecases/businessFunction/CreateBusinessFunction.usecase.js";
import GetAllBusinessFunctionsUseCase from "./application/usecases/businessFunction/GetAllBusinessFunctions.usecase.js";
import CreateCorrespondenceSubjectUseCase from "./application/usecases/correspondenceSubject/CreateCorrespondenceSubject.usecase.js";
import GetAllCorrespondenceSubjectUseCase from "./application/usecases/correspondenceSubject/GetAllCorrespondenceSubject.usecase.js";
import DocumentCreationUseCase from "./application/usecases/document/CreateDocument.usecase.js";
import DeleteDocumentUseCase from "./application/usecases/document/DeleteDocument.usecase.js";
import GetAllDocumentsByStaffUseCase from "./application/usecases/document/GetAllDocsByStaff.usecase.js";
import GetDocumentByIdUsecase from "./application/usecases/document/GetDocumentById.usecase.js";
import DocumentSubmissionUseCase from "./application/usecases/document/SubmitDocument.usecase.js";
import CreateDocumentTypeUsecase from "./application/usecases/documentType/CreateDocType.usecase.js";
import GetAllDocumentTypesUsecase from "./application/usecases/documentType/GetAllDocTypes.usecase.js";
import GetDocumentTypeByIdUsecase from "./application/usecases/documentType/GetDocTypeById.usecase.js";
import CreateMinuteUseCase from "./application/usecases/minute/CreateMinute.usecase.js";
import GetMinuteByIdUseCase from "./application/usecases/minute/GetMinuteById.usecase.js";
import GetMinutesByDocumentIdUseCase from "./application/usecases/minute/GetMinutesByDocumentId.usecase.js";
import BusinessFunctionEventsAdapter from "./infrastructure/adapters/BussFunctionEvents.adapter.js";
import CorrespondenceSubjectEventsAdapter from "./infrastructure/adapters/CorrSubjectEvents.adapter.js";
import DocumentEventsAdapter from "./infrastructure/adapters/DocumentEvents.adapter.js";
import DocumentTypeEventsAdapter from "./infrastructure/adapters/DocumentTypeEvents.adapter.js";
import BusinessFunctionRepoAdapter from "./infrastructure/persistence/BussFunctionRepository.adapter.js";
import CorrespondenceSubjectRepoAdapter from "./infrastructure/persistence/CorrSubjectRepository.adapter.js";
import DocTypeRepoAdapter from "./infrastructure/persistence/DocTypeRepository.adapter.js";
import DocumentAddresseeRepositoryAdapter from "./infrastructure/persistence/DocumentAddresseeRepository.adapter.js";
import DocumentRepositoryAdapter from "./infrastructure/persistence/DocumentRepository.adapter.js";
import DocVersionRepositoryAdapter from "./infrastructure/persistence/DocVersionRepository.adapter.js";
import LifecycleHistoryRepositoryAdapter from "./infrastructure/persistence/LifecycleHistoryRepository.adapter.js";
import MinuteRepositoryAdapter from "./infrastructure/persistence/MinuteRepository.adapter.js";
import ReferenceSequenceRepositoryAdapter from "./infrastructure/persistence/ReferenceSequenceRepository.adapter.js";
import ReferenceNumberService from "./infrastructure/services/ReferenceNumberService.adapter.js";
import type { DocumentIdentityPort } from "../shared/application/port/intersubsystem/DocumentIdentity.port.js";
import type { DocumentGovernancePolicyPort } from "../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { DocumentGovernanceContextPort } from "../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import DocumentGovernanceGuard from "./application/services/DocumentGovernanceGuard.service.js";
import ManageDocumentAttachmentUseCase from "./application/usecases/document/ManageDocumentAttachment.usecase.js";
import DocumentMediaRepositoryAdapter from "./infrastructure/persistence/DocumentMediaRepository.adapter.js";
import DocumentSignatureRepositoryAdapter from "./infrastructure/persistence/DocumentSignatureRepository.adapter.js";
import SignDocumentAsUnitHeadUseCase from "./application/usecases/document/SignDocumentAsUnitHead.usecase.js";
import type { DocumentGovernanceAuditPort } from "../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";
import DocumentGovernanceObligationExecutor from "./application/services/DocumentGovernanceObligationExecutor.service.js";
import DocumentGovernanceGrantRepositoryAdapter from "./infrastructure/persistence/DocumentGovernanceGrantRepository.adapter.js";
import DocumentSensitivityChangeRepositoryAdapter from "./infrastructure/persistence/DocumentSensitivityChangeRepository.adapter.js";
import ManageDocumentGovernanceGrantUseCase from "./application/usecases/document/ManageDocumentGovernanceGrant.usecase.js";
import ManageDocumentSensitivityUseCase from "./application/usecases/document/ManageDocumentSensitivity.usecase.js";
import DiscoverDocumentsUseCase from "./application/usecases/document/DiscoverDocuments.usecase.js";
import RenderDocumentExtractionUseCase from "./application/usecases/document/RenderDocumentExtraction.usecase.js";
import DocumentExtractionRepositoryAdapter from "./infrastructure/persistence/DocumentExtractionRepository.adapter.js";

interface DocumentSubsystemDependencies {
    documentIdentityAdapter: DocumentIdentityPort;
	documentGovernancePolicy: DocumentGovernancePolicyPort;
	documentGovernanceContext: DocumentGovernanceContextPort;
	documentGovernanceAudit: DocumentGovernanceAuditPort;
	retentionService: RetentionServicePort;
    globalEventBus: EventBusPort
}

export default async function DocumentSubsystem(
	fastify: FastifyInstance,
	dependencies: DocumentSubsystemDependencies,
) {
	// dependencies
	const { documentIdentityAdapter,retentionService, globalEventBus } = dependencies;

	// infrastructure Layer
	const postgres = fastify.pg;

	const idGenerator = new UuidV7Generator();
	const transactionManager = new TransactionManager(postgres);

	// all module repos in documents subsystem
	const documentRepository = new DocumentRepositoryAdapter(postgres);
	const documentAddresseeRepository =
		new DocumentAddresseeRepositoryAdapter(postgres);
	const docVersionRepository = new DocVersionRepositoryAdapter(postgres);
	const lifecycleHistoryRepository = new LifecycleHistoryRepositoryAdapter(postgres);
	const minuteRepository = new MinuteRepositoryAdapter(postgres);
	const corrSubjectRepository = new CorrespondenceSubjectRepoAdapter(postgres);
	const bussFunctionRepository = new BusinessFunctionRepoAdapter(postgres);
	const docTypeRepository = new DocTypeRepoAdapter(postgres);
	const documentMediaRepository = new DocumentMediaRepositoryAdapter(postgres);
	const documentSignatureRepository = new DocumentSignatureRepositoryAdapter(postgres);
	const documentGovernanceGrantRepository = new DocumentGovernanceGrantRepositoryAdapter(postgres);
	const documentSensitivityChangeRepository = new DocumentSensitivityChangeRepositoryAdapter(postgres);
	const documentExtractionRepository = new DocumentExtractionRepositoryAdapter(postgres);

	const refSequenceRepository =
		new ReferenceSequenceRepositoryAdapter(postgres);

	//  all module event adapters in documents subsystem
	const documentEventsAdapter = new DocumentEventsAdapter(globalEventBus);
	const corrSubjectEventsAdapter = new CorrespondenceSubjectEventsAdapter(globalEventBus);
	const bussFunctionEventsAdapter = new BusinessFunctionEventsAdapter(globalEventBus);
	const docTypeEventsAdapter = new DocumentTypeEventsAdapter(globalEventBus);

	// service
	const refNumberService = new ReferenceNumberService(refSequenceRepository);
	const governanceObligations = new DocumentGovernanceObligationExecutor(
		dependencies.documentGovernanceAudit,
	);
	const governanceGuard = new DocumentGovernanceGuard(
		dependencies.documentGovernancePolicy,
		dependencies.documentGovernanceContext,
		governanceObligations,
	);

	// application layer - documents
	const createNewDocumentUseCase = new DocumentCreationUseCase(
		idGenerator,
		documentRepository,
		documentAddresseeRepository,
		docVersionRepository,
		lifecycleHistoryRepository,
		docTypeRepository,
		documentEventsAdapter,
		refNumberService,
		documentIdentityAdapter,
		retentionService,
		dependencies.documentGovernancePolicy,
		dependencies.documentGovernanceContext,
		transactionManager,
	);

	const getAllDocsByStaffUseCase = new GetAllDocumentsByStaffUseCase(
		documentRepository,
		governanceGuard,
	);

	const getDocumentByIdUseCase = new GetDocumentByIdUsecase(
		documentRepository,
		governanceGuard,
	);
	const manageDocumentAttachmentUseCase = new ManageDocumentAttachmentUseCase(
		documentRepository,
		documentMediaRepository,
		governanceGuard,
		transactionManager,
	);
	const signDocumentAsUnitHeadUseCase = new SignDocumentAsUnitHeadUseCase(
		idGenerator,
		documentRepository,
		documentSignatureRepository,
		dependencies.documentGovernanceContext,
		transactionManager,
		dependencies.documentGovernanceAudit,
	);
	const manageDocumentGovernanceGrantUseCase = new ManageDocumentGovernanceGrantUseCase(
		idGenerator,
		documentRepository,
		documentGovernanceGrantRepository,
		dependencies.documentGovernanceContext,
		dependencies.documentGovernanceAudit,
		transactionManager,
	);
	const manageDocumentSensitivityUseCase = new ManageDocumentSensitivityUseCase(
		idGenerator,
		documentRepository,
		documentSensitivityChangeRepository,
		dependencies.documentGovernancePolicy,
		dependencies.documentGovernanceContext,
		dependencies.documentGovernanceAudit,
		transactionManager,
	);
	const discoverDocumentsUseCase = new DiscoverDocumentsUseCase(
		documentRepository,
		governanceGuard,
	);
	const renderDocumentExtractionUseCase = new RenderDocumentExtractionUseCase(
		idGenerator,
		documentRepository,
		documentGovernanceGrantRepository,
		documentExtractionRepository,
		governanceGuard,
		transactionManager,
	);

	const submitDocumentUseCase = new DocumentSubmissionUseCase(
        idGenerator,
		documentRepository,
        docVersionRepository,
        lifecycleHistoryRepository,
		documentEventsAdapter,
        transactionManager
	);

	const deleteDocumentUseCase = new DeleteDocumentUseCase(
        idGenerator,
		documentRepository,
        lifecycleHistoryRepository,
		documentEventsAdapter,
		governanceGuard,
	);

	const createMinuteUseCase = new CreateMinuteUseCase(
		idGenerator,
		documentRepository,
		minuteRepository,
	);

	const getMinuteByIdUseCase = new GetMinuteByIdUseCase(minuteRepository);

	const getMinutesByDocumentIdUseCase = new GetMinutesByDocumentIdUseCase(
		minuteRepository,
	);

	// application layer - correspondence subjects
	const createCorrSubjectUsecase = new CreateCorrespondenceSubjectUseCase(
		corrSubjectEventsAdapter,
		corrSubjectRepository,
	);

	const getAllCorrespondenceSubjectUseCase =
		new GetAllCorrespondenceSubjectUseCase(corrSubjectRepository);

	// application layer - business functions
	const getAllBusinessFunctionUseCase = new GetAllBusinessFunctionsUseCase(
		bussFunctionRepository,
	);

	const createBusinessFunctionUseCase = new CreateBusinessFunctionUseCase(
		bussFunctionEventsAdapter,
		bussFunctionRepository,
	);

	// application layer - document types
	const createDocumentTypeUseCase = new CreateDocumentTypeUsecase(
		idGenerator,
		docTypeRepository,
		docTypeEventsAdapter,
	);

	const getAllDocumentTypeUseCase = new GetAllDocumentTypesUsecase(
		docTypeRepository,
	);

	const getDocumentTypeByIdUseCase = new GetDocumentTypeByIdUsecase(
		docTypeRepository,
	);

	// controller Layer
	const documentController = new DocumentController(
		createNewDocumentUseCase,
		getAllDocsByStaffUseCase,
        getDocumentByIdUseCase,
		submitDocumentUseCase,
		deleteDocumentUseCase,
		manageDocumentAttachmentUseCase,
		signDocumentAsUnitHeadUseCase,
		manageDocumentGovernanceGrantUseCase,
		manageDocumentSensitivityUseCase,
		discoverDocumentsUseCase,
		renderDocumentExtractionUseCase,
	);

	const corrSubjectController = new CorrespondenceSubjectController(
		createCorrSubjectUsecase,
		getAllCorrespondenceSubjectUseCase,
	);

	const bussFunctionController = new BusinessFunctionController(
		createBusinessFunctionUseCase,
		getAllBusinessFunctionUseCase,
	);

	const documentTypeController = new DocumentTypeController(
		createDocumentTypeUseCase,
		getAllDocumentTypeUseCase,
        getDocumentTypeByIdUseCase
	);

	const minuteController = new MinuteController(
		createMinuteUseCase,
		getMinuteByIdUseCase,
		getMinutesByDocumentIdUseCase,
	);

	await fastify.register(documentRoutes, {
		controller: documentController,
		documentGovernancePolicy: dependencies.documentGovernancePolicy,
	});

	await fastify.register(correspondenceSubjectRoutes, {
		controller: corrSubjectController,
	});

	await fastify.register(businessFunctionRoutes, {
		controller: bussFunctionController,
	});

	await fastify.register(documentTypeRoutes, {
		controller: documentTypeController,
	});

	await fastify.register(minuteRoutes, {
		controller: minuteController,
	});
}
