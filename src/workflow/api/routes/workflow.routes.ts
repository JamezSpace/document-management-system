import type {
	FastifyInstance,
	FastifyRegister,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type WorkflowController from "../controller/WorkflowController.js";
import {
	documentIdSchema,
	taskIdSchema,
	workflowTaskActionSchema,
	type DocumentIdType,
	type TaskIdType,
	type WorkflowTaskActionType,
} from "../types/workflow.types.js";
import ApiError from "../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../shared/errors/enum/api.enum.js";

async function workflowRoutes(
	fastify: FastifyInstance,
	options: { controller: WorkflowController },
) {
	const workflowController = options.controller;

	fastify.get(
		"/documents/:documentId",
		{ schema: { params: documentIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocumentIdType }>,
			reply: FastifyReply,
		) => {
			const { documentId: docId } = request.params;

			const workflow =
				await workflowController.getWorkflowByDocument(docId);

			if (!workflow)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Workflow for document with id: ${docId} doesn't exist`,
				});
                
			return reply.code(200).send({ success: true, data: workflow });
		},
	);

	fastify.post(
		"/tasks/:taskId/approve",
		{ schema: { params: taskIdSchema, body: workflowTaskActionSchema } },
		async (
			request: FastifyRequest<{ Params: TaskIdType; Body: WorkflowTaskActionType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			if (!uid) {
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});
			}

			const { taskId } = request.params;
			const { minuteId } = request.body;

			const result = await workflowController.approveTask(taskId, uid, minuteId ?? null);

			return reply.code(200).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/tasks/:taskId/reject",
		{ schema: { params: taskIdSchema, body: workflowTaskActionSchema } },
		async (
			request: FastifyRequest<{ Params: TaskIdType; Body: WorkflowTaskActionType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			if (!uid) {
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});
			}

			const { taskId } = request.params;
			const { minuteId } = request.body;

			const result = await workflowController.rejectTask(taskId, uid, minuteId ?? null);

			return reply.code(200).send({ success: true, data: result });
		},
	);
}

export default workflowRoutes;
