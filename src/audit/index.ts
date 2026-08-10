import type { FastifyInstance } from "fastify";
import auditRoutes from "./api/routes/audit.routes.js";
import type { AuditEventRepositoryPort } from "./application/ports/AuditEventRepository.port.js";
import ListAuditEventsUseCase from "./application/usecases/ListAuditEvents.usecase.js";
import AuditEventRepositoryAdapter from "./infrastructure/persistence/AuditEventRepository.adapter.js";

interface AuditSubsystemDependencies {
	repository?: AuditEventRepositoryPort;
}

async function AuditSubsystem(
	fastify: FastifyInstance,
	dependencies: AuditSubsystemDependencies = {},
) {
	const repository =
		dependencies.repository ?? new AuditEventRepositoryAdapter(fastify.pg);
	const listAuditEvents = new ListAuditEventsUseCase(repository);

	await fastify.register(auditRoutes, { listAuditEvents });
}

export default AuditSubsystem;
export type { AuditSubsystemDependencies };
