import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type WorkspaceController from "../contoller/WorkspaceController.js";
import {
	documentIdSchema,
	type DocumentIdSchemaType,
} from "../types/document.type.js";

async function workspaceRoutes(
	fastify: FastifyInstance,
	options: {
		controller: WorkspaceController;
	},
) {
	const workspaceController = options.controller;

	fastify.get(
		"workspace/:documentId",
		{ schema: { params: documentIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply
		) => {
            const { uid } = request.user!;
			const { id: documentId } = request.params;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});
            
			const result =
				await workspaceController.resolveWorkspacePermissions(documentId, uid);

			return reply.code(200).send({
				success: true,
				data: result
			});
		},
	);
}


export default workspaceRoutes;