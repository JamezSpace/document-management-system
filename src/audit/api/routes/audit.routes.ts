import type { FastifyInstance, FastifyRequest } from "fastify";
import { routePolicies } from "../../../security/application/authorization.types.js";
import type ListAuditEventsUseCase from "../../application/usecases/ListAuditEvents.usecase.js";
import {
	auditEventQuerySchema,
	type AuditEventQuery,
} from "../types/audit.types.js";

async function auditRoutes(
	fastify: FastifyInstance,
	options: { listAuditEvents: ListAuditEventsUseCase },
) {
	fastify.get(
		"/events",
		{
			config: {
				authorization: routePolicies.capability("audit.event.view"),
			},
			schema: { querystring: auditEventQuerySchema },
		},
		async (
			request: FastifyRequest<{ Querystring: AuditEventQuery }>,
			reply,
		) => {
			const events = await options.listAuditEvents.execute(
				request.actor!,
				request.query,
			);

			return reply.code(200).send({ success: true, data: events });
		},
	);
}

export default auditRoutes;
