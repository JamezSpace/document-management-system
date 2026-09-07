import type { FastifyInstance, FastifyRequest } from "fastify";
import { DocumentCapabilities } from "../../../documents/domain/enum/documentCapabilities.enum.js";
import { routePolicies } from "../../../security/application/type/authorization.type.js";
import type WorkItemController from "../controllers/WorkItemController.js";
import {
	workItemParamsSchema,
	workItemQuerySchema,
	type WorkItemParamsType,
	type WorkItemQueryType,
} from "../types/workItem.types.js";

async function workItemRoutes(
	fastify: FastifyInstance,
	options: { controller: WorkItemController },
) {
	fastify.get(
		"/",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.VIEW) },
			schema: { querystring: workItemQuerySchema },
		},
		async (request: FastifyRequest<{ Querystring: WorkItemQueryType }>, reply) => {
			const page = await options.controller.list(request.actor!.staffId, request.query);
			return reply.code(200).send({ success: true, data: page });
		},
	);

	fastify.get(
		"/:workItemId",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.VIEW) },
			schema: { params: workItemParamsSchema },
		},
		async (request: FastifyRequest<{ Params: WorkItemParamsType }>, reply) => {
			const item = await options.controller.get(request.actor!.staffId, request.params.workItemId);
			return reply.code(200).send({ success: true, data: item });
		},
	);
}

export default workItemRoutes;
