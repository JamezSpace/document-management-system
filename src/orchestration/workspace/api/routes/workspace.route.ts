import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type WorkspaceController from "../contoller/WorkspaceController.js";
import {
	documentIdSchema,
	type DocumentIdSchemaType,
} from "../types/document.type.js";
import { routePolicies } from "../../../../security/application/type/authorization.type.js";
import { DocumentCapabilities } from "../../../../documents/domain/enum/documentCapabilities.enum.js";
import { Type, type Static } from "@sinclair/typebox";

const workspaceQuerySchema = Type.Object({
	canvas: Type.Optional(Type.Union([Type.Literal("internal"), Type.Literal("letterhead")])),
});
type WorkspaceQuery = Static<typeof workspaceQuerySchema>;

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
				authorization: routePolicies.capability(DocumentCapabilities.VIEW),
			},
			schema: { params: documentIdSchema, querystring: workspaceQuerySchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType; Querystring: WorkspaceQuery }>,
			reply: FastifyReply
		) => {
			const { documentId } = request.params;

			const result =
				await workspaceController.resolveWorkspacePermissions(
					documentId,
					request.actor!.staffId,
					request.query.canvas ?? "internal",
				);

			return reply.header("ETag", `\"${result.metadata.document.revision}\"`).code(200).send({
				success: true,
				data: result
			});
		},
	);
}


export default workspaceRoutes;
