import type { FastifyInstance } from "fastify";
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import NotificationController from "./api/controllers/NotificationController.js";
import notificationRoutes from "./api/routes/notifications.route.js";
import GetStaffNotificationUseCase from "./application/usecases/GetStaffNotifications.usecase.js";
import registerAllDispatchSubscribers from "./bootstrap/dispatch/registerAllDispatchSubscribers.bootstrap.js";
import registerAllDocumentSubscribers from "./bootstrap/documents/registerAllDocumentSubscribers.bootstrap.js";
import NotificationRepositoryAdapter from "./infrastructure/repos/NotificationRepository.adapter.js";

interface NotificationSubsystemDependencies {
    globalEventBus: EventBusPort
}

export default async function NotificationSubsystem(fastify: FastifyInstance, dependencies: NotificationSubsystemDependencies) {
    // dependencies
    const { globalEventBus } = dependencies;

    const postgres = fastify.pg;

    const idGenerator = new UuidV7Generator();

    const notificationRepository = new NotificationRepositoryAdapter(postgres);
    const getStaffNotificationUseCase = new GetStaffNotificationUseCase(notificationRepository);
    const notificationController = new NotificationController(getStaffNotificationUseCase);

    // listener for document subsystem event emission
    registerAllDocumentSubscribers(postgres, globalEventBus);
    
    // listener for dispatch subsystem event emission
    registerAllDispatchSubscribers(postgres, globalEventBus);

    await fastify.register(notificationRoutes, {
        controller: notificationController,
    });
}
