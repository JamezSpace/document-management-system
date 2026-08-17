import type { PostgresDb } from "@fastify/postgres";
import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../../../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import WorkflowTasksAssignedHandler from "../../application/handlers/workflow/WorkflowTaskAssigned.handler.js";
import CreateNotificationUseCase from "../../application/usecases/CreateNotification.usecase.js";
import NotificationRepositoryAdapter from "../../infrastructure/repos/NotificationRepository.adapter.js";

export default function registerAllWorkflowSubscribers(dbPool: PostgresDb, eventBus: EventBusPort) {
    const notificationRepoAdapter = new NotificationRepositoryAdapter(dbPool);
    const idGenerator = new UuidV7Generator();

    const createNotificationUseCase = new CreateNotificationUseCase(idGenerator, notificationRepoAdapter);
    
    const workflowTasksAssignedHandler = new WorkflowTasksAssignedHandler(createNotificationUseCase);

    eventBus.subscribe(
    GlobalEventTypes.workflow.WORKFLOW_TASKS_ASSIGNED,
    async event => workflowTasksAssignedHandler.handle(event)
);
}

