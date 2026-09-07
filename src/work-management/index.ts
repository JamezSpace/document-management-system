import type { FastifyInstance } from "fastify";
import WorkItemController from "./api/controllers/WorkItemController.js";
import workItemRoutes from "./api/routes/workItem.routes.js";
import type { WorkItemRepositoryPort } from "./application/ports/WorkItemRepository.port.js";
import GetWorkItemUseCase from "./application/usecases/GetWorkItem.usecase.js";
import ListWorkItemsUseCase from "./application/usecases/ListWorkItems.usecase.js";
import PostgresWorkItemRepository from "./infrastructure/persistence/PostgresWorkItemRepository.adapter.js";

interface WorkManagementDependencies {
	repository?: WorkItemRepositoryPort;
}

async function WorkManagementSubsystem(
	fastify: FastifyInstance,
	dependencies: WorkManagementDependencies = {},
) {
	const repository = dependencies.repository ?? new PostgresWorkItemRepository(fastify.pg);
	const controller = new WorkItemController(
		new ListWorkItemsUseCase(repository),
		new GetWorkItemUseCase(repository),
	);

	await fastify.register(workItemRoutes, { controller });
}

export default WorkManagementSubsystem;
export type { WorkManagementDependencies };
