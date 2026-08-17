import type { PostgresDb } from "@fastify/postgres";
import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../../../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import DocumentDispatchedHandler from "../../application/handlers/dispatch/DocumentDispatched.handler.js";
import CreateNotificationUseCase from "../../application/usecases/CreateNotification.usecase.js";
import NotificationRepositoryAdapter from "../../infrastructure/repos/NotificationRepository.adapter.js";

export default function registerAllDispatchSubscribers(dbPool: PostgresDb, eventBus: EventBusPort) {
    const idGenerator = new UuidV7Generator();
    const notificationRepoAdapter = new NotificationRepositoryAdapter(dbPool);

    const createNotificationUseCase = new CreateNotificationUseCase(idGenerator, notificationRepoAdapter);

    const documentDispatchedHandler = new DocumentDispatchedHandler(createNotificationUseCase);

     eventBus.subscribe(
        GlobalEventTypes.dispatch.DOC_DISPATCHED,
        async event => documentDispatchedHandler.handle(event)
    )
}