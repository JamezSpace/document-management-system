import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { fastifyPostgres } from "@fastify/postgres";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify, { type FastifyInstance } from "fastify";
import DispatchSubsystem from "./dispatch/index.js";
import DocumentSubsystem from "./documents/index.js";
import DispatchDocumentAdapter from "./documents/infrastructure/persistence/DispatchDocumentRepository.adapter.js";
import WorkflowDocumentAdapter from "./documents/infrastructure/persistence/WorkflowDocument.adapter.js";
import RetentionService from "./documents/infrastructure/services/RetentionService.adapter.js";
import WorkflowAccessRepositoryAdapter from "./i & a/access/infrastructure/persistence/WorkflowAccessRepository.adapter.js";
import IdentityAccessSubsystem from "./i & a/index.js";
import DispatchStaffAdapter from "./i & a/identity/infrastructure/persistence/entities/staff/DispatchStaffRepo.adapter.js";
import DocumentIdentityAdapter from "./i & a/identity/infrastructure/persistence/DocumentIdentity.adapter.js";
import FirebaseAuthAdapter from "./i & a/identity/infrastructure/services/auth/FirebaseAuth.adapter.js";
import NotificationSubsystem from "./notifications/index.js";
import OrchestrationSubsystem from "./orchestration/workspace/index.js";
import PolicySubsystem, { createDocumentGovernancePolicyPort } from "./policy/index.js";
import DocumentRetentionPolicyAdapter from "./policy/infrastructre/persistence/DocRetentionPolicy.adapter.js";
import WorkflowPolicyAdapter from "./policy/infrastructre/persistence/WorkflowPolicy.adapter.js";
import { registerAuthorizationHooks } from "./security/api/authorization.hooks.js";
import type { ActorContextRepositoryPort } from "./security/application/port/ActorContextRepository.port.js";
import { routePolicies } from "./security/application/type/authorization.type.js";
import PostgresActorContextRepository from "./security/infrastructure/PostgresActorContextRepository.js";
import NexusError from "./shared/errors/NexusError.js";
import InMemoryEventBusAdapter from "./shared/infrastructure/InMemoryEventBus.js";
import { dbConfig } from "./shared/infrastructure/persistence/primary/postgres.config.js";
import WorkflowSubsystem from "./workflow/index.js";

interface BuildAppOptions {
	logger?: boolean;
}

/**
 * Builds the HTTP application without binding a port. Keeping construction and
 * startup separate lets authorization and route registration be tested with
 * Fastify's inject API.
 */
function buildApp(options: BuildAppOptions = {}): FastifyInstance {
	const server = fastify({
		logger: options.logger ?? true,
	}).withTypeProvider<TypeBoxTypeProvider>();

	server.register(fastifyCors, {
		origin: process.env.FRONTEND_ORIGIN ?? false,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	});
	server.register(fastifyPostgres, dbConfig);
	server.register(fastifyMultipart, {
		attachFieldsToBody: "keyValues",
		limits: { fileSize: 5 * 1024 * 1024 },
	});

	server.decorateRequest("user", null);
	server.decorateRequest("actor", null);

	// Resolve the pool lazily: Fastify decorates `pg` when the postgres plugin is
	// initialized, while request hooks execute only after initialization.
	const actorRepository: ActorContextRepositoryPort = {
		resolveByAuthProviderId: (providerId) =>
			new PostgresActorContextRepository(server.pg).resolveByAuthProviderId(
				providerId,
			),
	};

	registerAuthorizationHooks(server, {
		authService: new FirebaseAuthAdapter(),
		actorRepository,
	});

	const eventBusAdapter = new InMemoryEventBusAdapter();

	server.register(IdentityAccessSubsystem, { prefix: "/api/identity" });

	server.after(() => {
		const documentPolicyAdapter = new DocumentRetentionPolicyAdapter(server.pg);
		const documentWorkflowAdapter = new WorkflowDocumentAdapter(server.pg);
		const policyWorkflowAdapter = new WorkflowPolicyAdapter(server.pg);
		const accessWorkflowAdapter = new WorkflowAccessRepositoryAdapter(server.pg);
		const documentIdentityAdapter = new DocumentIdentityAdapter(server.pg);
		const retentionService = new RetentionService(documentPolicyAdapter);
		const dispatchStaffAdapter = new DispatchStaffAdapter(server.pg);
		const dispatchDocumentAdapter = new DispatchDocumentAdapter(server.pg);
		const documentGovernancePolicy =
			createDocumentGovernancePolicyPort(server.pg);

		server.register(DocumentSubsystem, {
			prefix: "/api/document",
			documentIdentityAdapter,
			documentGovernancePolicy,
			retentionService,
			globalEventBus: eventBusAdapter,
		});

		server.register(OrchestrationSubsystem, {
			prefix: "/api",
			documentGovernancePolicy,
			workflowPolicy: policyWorkflowAdapter,
		});
		server.register(PolicySubsystem, { prefix: "/api/policy" });
		server.register(WorkflowSubsystem, {
			prefix: "/api/workflow",
			documentWorkflowAdapter,
			policyWorkflowAdapter,
			accessWorkflowAdapter,
			globalEventBus: eventBusAdapter,
		});
		server.register(DispatchSubsystem, {
			globalEventBus: eventBusAdapter,
			dispatchStaffAdapter,
			dispatchDocumentAdapter,
		});
		server.register(NotificationSubsystem, {
			prefix: "/api/notifications",
			globalEventBus: eventBusAdapter,
		});
	});

	server.get(
		"/",
		{ config: { authorization: routePolicies.public } },
		async () => "hit base end point",
	);

	server.setErrorHandler((error, request, reply) => {
		request.log.error({ err: error }, "Request failed");

		if (error instanceof NexusError) {
			return reply.code(error.httpStatusCode).send({
				success: false,
				error: {
					code: {
						codeName: error.errorCode,
						httpStatusCode: error.httpStatusCode,
					},
					context: {
						category: error.category,
						message: error.message,
						retryable: error.retryable,
						details: error.details,
						requestId: request.id,
					},
				},
			});
		}

		return reply.code(500).send({
			success: false,
			error: {
				code: {
					codeName: "internal_server_error",
					httpStatusCode: 500,
				},
				context: {
					category: "server",
					message: "The request could not be completed.",
					retryable: true,
					requestId: request.id,
				},
			},
		});
	});

	return server;
}

export { buildApp, type BuildAppOptions };
export default buildApp;
