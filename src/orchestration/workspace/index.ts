import type { FastifyInstance } from "fastify";
import DocumentRepositoryAdapter from "../../documents/infrastructure/persistence/DocumentRepository.adapter.js";
import type { OrchestrationDocumentPort } from "../../shared/application/port/intersubsystem/OrchestrationDocument.port.js";
import type { DocumentGovernancePolicyPort } from "../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { WorkflowPolicyPort } from "../../shared/application/port/intersubsystem/WorkflowPolicy.port.js";
import UuidV7Generator from "../../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import EvaluateWorkflowContextUsecase from "../../workflow/application/usecases/EvaluateWorkflowContext.usecase.js";
import WorkflowEngine from "../../workflow/domain/WorkflowEngine.service.js";
import WorkflowRepository from "../../workflow/infrastructure/persistence/WorkflowRepository.adapter.js";
import WorkspaceController from "./api/contoller/WorkspaceController.js";
import workspaceRoutes from "./api/routes/workspace.route.js";
import GetDocumentUsecase from "./application/usecases/GetDocument.usecase.js";
import GetWorkflowContextUsecase from "./application/usecases/GetWorkflowContext.usecase.js";

export default async function OrchestrationSubsystem(
	fastify: FastifyInstance,
	options: {
		documentGovernancePolicy: DocumentGovernancePolicyPort;
		workflowPolicy: WorkflowPolicyPort;
	},
) {
	const documentRepository = new DocumentRepositoryAdapter(fastify.pg);
	const workflowRepository = new WorkflowRepository(fastify.pg);
	const workflowEngine = new WorkflowEngine(new UuidV7Generator());

	const orchestrationDocumentPort: OrchestrationDocumentPort = {
		getDocument: (documentId) =>
			documentRepository.findDocumentById(documentId),
	};
	const orchestrationWorkflowPort = new EvaluateWorkflowContextUsecase(
		workflowEngine,
		workflowRepository,
		options.workflowPolicy,
	);

	const workspaceController = new WorkspaceController(
		new GetDocumentUsecase(orchestrationDocumentPort),
		new GetWorkflowContextUsecase(orchestrationWorkflowPort),
		options.documentGovernancePolicy,
	);

	await fastify.register(workspaceRoutes, {
		controller: workspaceController,
	});
}
