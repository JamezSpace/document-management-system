import type { FastifyInstance } from "fastify";
import type { PostgresDb } from "@fastify/postgres";
import type { DocumentGovernancePolicyPort } from "../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import InMemoryEventBusAdapter from "../shared/infrastructure/InMemoryEventBus.js";
import DocumentRetentionPolicyController from "./api/controllers/DocumentRetentionPolicyController.js";
import documentRetentionPolicyRoutes from "./api/routes/docRetPolicy.route.js";
import CreateDocumentRetentionPolicyUsecase from "./application/usecases/CreateDocumentRetentionPolicy.usecase.js";
import DocumentRetentionPolicyEventsAdapter from "./infrastructre/adapters/DocRetPolicyEvents.adapter.js";
import DocumentRetentionPolicyAdapter from "./infrastructre/persistence/DocRetentionPolicy.adapter.js";
import DocumentGovernancePolicyService from "./application/services/DocumentGovernancePolicy.service.js";
import DocumentGovernancePolicyRepositoryAdapter from "./infrastructre/persistence/DocumentGovernancePolicyRepository.adapter.js";

function createDocumentGovernancePolicyPort(
	postgres: PostgresDb,
): DocumentGovernancePolicyPort {
	return new DocumentGovernancePolicyService(
		new DocumentGovernancePolicyRepositoryAdapter(postgres),
	);
}

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

export { createDocumentGovernancePolicyPort };
