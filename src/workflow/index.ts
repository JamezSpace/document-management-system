import type { FastifyInstance } from "fastify";
import type { WorkflowAccessPort } from "../shared/application/port/intersubsystem/WorkflowAccess.port.js";
import type { WorkflowDocumentPort } from "../shared/application/port/intersubsystem/WorkflowDocument.port.js";
import type { WorkflowPolicyPort } from "../shared/application/port/intersubsystem/WorkflowPolicy.port.js";
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import TransactionManager from "../shared/infrastructure/persistence/primary/TransactionManager.js";
import WorkflowController from "./api/controller/WorkflowController.js";
import workflowRoutes from "./api/routes/workflow.routes.js";
import ApproveWorkflowTaskUseCase from "./application/usecases/ApproveWorkflowTask.usecase.js";
import GetWorkflowUseCase from "./application/usecases/GetWorkflow.usecase.js";
import RejectWorkflowTaskUseCase from "./application/usecases/RejectWorkflowTask.usecase.js";
import StartWorkflowUseCase from "./application/usecases/StartWorkflow.usecase.js";
import registerAllWorkflowSubscribers from "./bootstrap/registerDocumentSubscribers.js";
import WorkflowEngine from "./domain/WorkflowEngine.service.js";
import WorkflowEventsAdapter from "./infrastructure/adapters/events/WorkflowEventsAdapter.js";
import WorkflowStarterAdapter from "./infrastructure/adapters/WorkflowStarter.adapter.js";
import WorkflowRepository from "./infrastructure/persistence/WorkflowRepository.adapter.js";
import ApproverResolverServiceAdapter from "./infrastructure/services/ApproverResolverService.adapter.js";

interface WorkflowSubsystemDependencies {
	documentWorkflowAdapter: WorkflowDocumentPort;
	policyWorkflowAdapter: WorkflowPolicyPort;
	accessWorkflowAdapter: WorkflowAccessPort;
	globalEventBus: EventBusPort;
}

export default async function WorkflowSubsystem(
	fastify: FastifyInstance,
	dependencies: WorkflowSubsystemDependencies,
) {
	// dependencies
	const {
		documentWorkflowAdapter,
		policyWorkflowAdapter,
		accessWorkflowAdapter,
		globalEventBus,
	} = dependencies;

	const postgres = fastify.pg;
	const idGenerator = new UuidV7Generator();

	// adapter - events
	const workflowEventsAdapter = new WorkflowEventsAdapter(globalEventBus);

	// adapter - persistence
	const workflowRepository = new WorkflowRepository(postgres);
    const transactionManager = new TransactionManager(postgres);

	// use cases
	const workflowEngine = new WorkflowEngine(idGenerator);
	const approverResolver = new ApproverResolverServiceAdapter(
		accessWorkflowAdapter,
	);

	const startWorkflowUseCase = new StartWorkflowUseCase(
		idGenerator,
		documentWorkflowAdapter,
		policyWorkflowAdapter,
		workflowEngine,
		approverResolver,
		workflowRepository,
		workflowEventsAdapter,
        transactionManager
	);

	const workflowStarterAdapter = new WorkflowStarterAdapter(
		startWorkflowUseCase,
	);

	const approveWorkflowTaskUseCase = new ApproveWorkflowTaskUseCase(
		workflowRepository,
		policyWorkflowAdapter,
		documentWorkflowAdapter,
		workflowEngine,
		approverResolver,
		transactionManager,
	);

	const rejectWorkflowTaskUseCase = new RejectWorkflowTaskUseCase(
		workflowRepository,
		transactionManager,
	);

	const getWorkflowUseCase = new GetWorkflowUseCase(workflowRepository);

	const workflowController = new WorkflowController(
		getWorkflowUseCase,
		approveWorkflowTaskUseCase,
		rejectWorkflowTaskUseCase,
	);

	registerAllWorkflowSubscribers(globalEventBus, workflowStarterAdapter);

	await fastify.register(workflowRoutes, {
		controller: workflowController,
	});
}
