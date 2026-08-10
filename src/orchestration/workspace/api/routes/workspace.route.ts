import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type WorkspaceController from "../contoller/WorkspaceController.js";
import {
	documentIdSchema,
	type DocumentIdSchemaType,
} from "../types/document.type.js";
import { routePolicies } from "../../../../security/application/authorization.types.js";

async function workspaceRoutes(
	fastify: FastifyInstance,
	options: {
		controller: WorkspaceController;
	},
) {
	const workspaceController = options.controller;

	fastify.get(
		"/workspace/:documentId",
		{
			config: {
				authorization: routePolicies.capability("document.view"),
			},
			schema: { params: documentIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply
		) => {
			const { documentId } = request.params;

			const result =
				await workspaceController.resolveWorkspacePermissions(
					documentId,
					request.actor!.staffId,
				);

			return reply.code(200).send({
				success: true,
				data: result
			});
		},
	);
}


export default workspaceRoutes;
