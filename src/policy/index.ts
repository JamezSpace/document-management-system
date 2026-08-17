import type { FastifyInstance } from "fastify";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import DocumentRetentionPolicyController from "./api/controllers/DocumentRetentionPolicyController.js";
import documentRetentionPolicyRoutes from "./api/routes/docRetPolicy.route.js";
import CreateDocumentRetentionPolicyUsecase from "./application/usecases/CreateDocumentRetentionPolicy.usecase.js";
import DocumentRetentionPolicyEventsAdapter from "./infrastructre/adapters/DocRetPolicyEvents.adapter.js";
import DocumentRetentionPolicyAdapter from "./infrastructre/persistence/DocRetentionPolicy.adapter.js";

export default async function PolicySubsystem(fastify: FastifyInstance) {
    const postgres = fastify.pg;

    const globalEventBus = new InMemoryEventBusAdapter();
    const idGenerator = new UuidV7Generator();

    // repo
    const retentionPolicyRepo = new DocumentRetentionPolicyAdapter(
        postgres,
    );

    // events
    const retentionPolicyEvents = new DocumentRetentionPolicyEventsAdapter(globalEventBus)

    // usecase
    const createDocumentRetentionPolicyUsecase =
        new CreateDocumentRetentionPolicyUsecase(
            idGenerator,
            retentionPolicyRepo,
            retentionPolicyEvents,
        );


    // controller
    const documentRetentionPolicyController =
        new DocumentRetentionPolicyController(
            createDocumentRetentionPolicyUsecase,
        );

    await fastify.register(documentRetentionPolicyRoutes, {
        controller: documentRetentionPolicyController,
    });
}
