import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { fastifyPostgres } from "@fastify/postgres";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify, {
    type FastifyInstance,
    type FastifyReply,
    type FastifyRequest,
} from "fastify";
import DispatchSubsystem from "./dispatch/index.js";
import DocumentSubsystem from "./documents/index.js";
import WorkflowDocumentAdapter from "./documents/infrastructure/persistence/WorkflowDocument.adapter.js";
import RetentionService from "./documents/infrastructure/services/RetentionService.adapter.js";
import WorkflowAccessRepositoryAdapter from "./i & a/access/infrastructure/persistence/WorkflowAccessRepository.adapter.js";
import middlewareAdapterInstance from "./i & a/identity/api/middleware/adapter/FirebaseMiddleware.adapter.js";
import IdentityAccessSubsystem from "./i & a/index.js";
import NotificationSubsystem from "./notifications/index.js";
import PolicySubsystem from "./policy/index.js";
import DocumentRetentionPolicyAdapter from "./policy/infrastructre/persistence/DocRetentionPolicy.adapter.js";
import WorkflowPolicyAdapter from "./policy/infrastructre/persistence/WorkflowPolicy.adapter.js";
import type { NexusAppError } from "./shared/errors/api/nexusAppError.type.js";
import InMemoryEventBusAdapter from "./shared/infrastructure/InMemoryEventBus.js";
import { dbConfig } from "./shared/infrastructure/persistence/primary/postgres.config.js";
import WorkflowSubsystem from "./workflow/index.js";
import DispatchStaffAdapter from "./i & a/identity/infrastructure/persistence/entities/staff/DispatchStaffRepo.adapter.js";
import DispatchDocumentAdapter from "./documents/infrastructure/persistence/DispatchDocumentRepository.adapter.js";
import DocumentIdentityAdapter from "./i & a/identity/infrastructure/persistence/DocumentIdentity.adapter.js";
import OrchestrationSubsystem from "./orchestration/workspace/index.js";

const server: FastifyInstance = fastify({
	logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// load plugins (from the Fastify ecosystem) next
server.register(fastifyCors, {
	origin: process.env.FRONTEND_ORIGIN!,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
});
server.register(fastifyPostgres, dbConfig);
server.register(fastifyMultipart, {
	attachFieldsToBody: "keyValues",
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
});

// global event bus
const eventBusAdapter = new InMemoryEventBusAdapter();

// load your plugins (your custom plugins) next
server.register(IdentityAccessSubsystem, { prefix: "api/identity" });

server.after(() => {
	// intersubsystem repo adapters
    // documents subsystem
	const documentPolicyAdapter = new DocumentRetentionPolicyAdapter(server.pg);
	const documentWorkflowAdapter = new WorkflowDocumentAdapter(server.pg);
	const policyWorkflowAdapter = new WorkflowPolicyAdapter(server.pg);
	const accessWorkflowAdapter = new WorkflowAccessRepositoryAdapter(server.pg);
    const documentIdentityAdapter = new DocumentIdentityAdapter(server.pg);

	// documents subsystem - services
	const retentionService = new RetentionService(documentPolicyAdapter);

    // dispatch subsystem
    const dispatchStaffAdapter = new DispatchStaffAdapter(server.pg);
    const dispatchDocumentAdapter = new DispatchDocumentAdapter(server.pg);

	server.register(DocumentSubsystem, {
		prefix: "api/document",
        documentIdentityAdapter,
		retentionService,
		globalEventBus: eventBusAdapter,
	});

    // orchestration layer
    server.register(OrchestrationSubsystem, {
        prefix: "api/"
    })

	server.register(PolicySubsystem, { prefix: "api/policy" });

	server.register(WorkflowSubsystem, {
		prefix: "api/workflow",
		documentWorkflowAdapter,
		policyWorkflowAdapter,
		accessWorkflowAdapter,
		globalEventBus: eventBusAdapter,
	});

    server.register(DispatchSubsystem, {
        globalEventBus: eventBusAdapter,
        dispatchStaffAdapter,
        dispatchDocumentAdapter
    })

	server.register(NotificationSubsystem, {
		prefix: "api/notifications",
		globalEventBus: eventBusAdapter,
	});
});

// load decorators next

// decorate fastify instance with user property
server.decorateRequest("user", null);

// load hooks next
server.addHook("preHandler", async (req: FastifyRequest, reply) => {
	const publicRoutes = [
		{
			method: ["GET"],
			pattern:
				/^\/api\/identity\/entity\/[^/]+$/,
		},
		{
			method: ["GET", "PATCH"],
			pattern:
				/^\/api\/identity\/invite\/[^/]+\/onboarding\/session$/,
		},
		{
			method: ["PATCH"],
			pattern:
				/^\/api\/identity\/invite\/onboarding\/session\/[^/]+$/,
		},
		{
			method: ["PATCH"],
			pattern:
				/^\/api\/identity\/invite\/onboarding\/session\/[^/]+\/completed$/,
		},
		{
			method: ["POST"],
			pattern:
				/^\/api\/identity\/invite\/onboarding\/session$/,
		},
		{
			method: ["POST"],
			pattern:
				/^\/api\/identity\/invite\/onboarding\/session\/[^/]+\/media$/,
		},
        {
			method: ["PATCH"],
			pattern:
				/^\/api\/identity\/staff\/[^/]+\/activate$/,
		},
	];

	const isPublic = publicRoutes.some(
		(route) => route.method.includes(req.method) && route.pattern.test(req.url),
	);

	console.log("Is Route Public:", isPublic);
	if (isPublic) return;

	return middlewareAdapterInstance.validateUserIsAuthenticated(req, reply);
});

server.get("/", (request: FastifyRequest, reply: FastifyReply) => {
	reply.code(200).send("hit base end point");
});

// set global error handler
server.setErrorHandler(
	(error: NexusAppError, request: FastifyRequest, reply: FastifyReply) => {
		console.log("handler error:", error);

		if (error)
			return reply.code(error.httpStatusCode).send({
				success: false,
				error: {
					code: error.errorCode,
					message: error.errorMessage,
					details: error?.details,
				},
			});

		return reply.code(500).send({
			success: false,
		});
	},
);

server.listen(
	{ port: Number(process.env?.PORT) || 4200, host: "0.0.0.0" },
	(err, address) => {
		if (err) {
			server.log.error(err);
			process.exit(1);
		}

		server.log.info(`Server running on port ${address}!`);
	},
);
