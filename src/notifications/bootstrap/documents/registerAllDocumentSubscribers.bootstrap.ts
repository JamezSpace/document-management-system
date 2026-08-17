import type { PostgresDb } from "@fastify/postgres";
import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../../../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import BusinessFunctionCreatedHandler from "../../application/handlers/documents/BussFunctionCreated.handler.js";
import CreateNotificationUseCase from "../../application/usecases/CreateNotification.usecase.js";
import NotificationRepositoryAdapter from "../../infrastructure/repos/NotificationRepository.adapter.js";


export default function registerAllDocumentSubscribers(dbPool: PostgresDb, eventBus: EventBusPort) {
    const notificationRepoAdapter = new NotificationRepositoryAdapter(dbPool);
    const idGenerator = new UuidV7Generator();

    const createNotificationUseCase = new CreateNotificationUseCase(idGenerator, notificationRepoAdapter);

    const businessFunctionHandler = new BusinessFunctionCreatedHandler(createNotificationUseCase)

    eventBus.subscribe(
        GlobalEventTypes.document.business_function.BUSS_FUNCTION_CREATED,
        async event => businessFunctionHandler.handle(event)
    )

}