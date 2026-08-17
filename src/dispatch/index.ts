import type { FastifyInstance } from "fastify";
import type { EventBusPort } from "../shared/application/port/services/eventbus.port.js";
import UuidV7Generator from "../shared/infrastructure/adapters/Uuidv7Generator.adapter.js";
import TransactionManager from "../shared/infrastructure/persistence/primary/TransactionManager.js";
import RecipientResolverService from "./application/services/RecipientResolver.service.js";
import SendCorrespondenceUseCase from "./application/usecases/SendCorrespondence.usecase.js";
import registerAllDispatchSubscribers from "./bootstrap/registerDispatchSubscribers.js";
import DispatchEventsAdapter from "./infrastructure/events/DispatchEvents.adapter.js";
import DispatchStarterAdapter from "./infrastructure/events/DispatchStarter.adapter.js";
import DispatchRecordRepoAdapter from "./infrastructure/persistence/DispatchRecordRepo.adapter.js";
import InboxEntryRepoAdapter from "./infrastructure/persistence/InboxEntryRepo.adapter.js";
import type { DispatchStaffPort } from "../shared/application/port/intersubsystem/DispatchStaff.port.js";
import type { DispatchDocumentPort } from "../shared/application/port/intersubsystem/DispatchDocument.port.js";

interface DispatchSubsystemDependencies {
	globalEventBus: EventBusPort;
	dispatchStaffAdapter: DispatchStaffPort;
	dispatchDocumentAdapter: DispatchDocumentPort;
}

export default async function DispatchSubsystem(
	fastify: FastifyInstance,
	dependencies: DispatchSubsystemDependencies,
) {
	// dependencies
	const { globalEventBus, dispatchStaffAdapter, dispatchDocumentAdapter } =
		dependencies;

	// infrastructure layer
	const postgres = fastify.pg;
	const idGenerator = new UuidV7Generator();
	const transactionManager = new TransactionManager(postgres);

	const dispatchRecordRepository = new DispatchRecordRepoAdapter(postgres);
	const inboxEntryRepository = new InboxEntryRepoAdapter(postgres);

	// events adapter
	const dispatchEventsAdapter = new DispatchEventsAdapter(globalEventBus);

	// services
	const recipientResolver = new RecipientResolverService(
		dispatchDocumentAdapter,
		dispatchStaffAdapter,
	);

	// use cases
	const sendCorrespondenceUseCase = new SendCorrespondenceUseCase(
		idGenerator,
		dispatchDocumentAdapter,
		dispatchRecordRepository,
		dispatchStaffAdapter,
		inboxEntryRepository,
		recipientResolver,
		dispatchEventsAdapter,
		transactionManager,
	);

	const dispatchStarterAdapter = new DispatchStarterAdapter(
		sendCorrespondenceUseCase,
	);

	// listener for document subsystem event emission
	registerAllDispatchSubscribers(globalEventBus, dispatchStarterAdapter);
}
