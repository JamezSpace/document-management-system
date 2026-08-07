import type {
	FastifyInstance,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type WorkflowController from "../controller/WorkflowController.js";
import {
	documentIdSchema,
	taskIdSchema,
	workflowTaskApprovalSchema,
	workflowTaskRejectionSchema,
	type DocumentIdType,
	type TaskIdType,
	type WorkflowTaskApprovalType,
	type WorkflowTaskRejectionType,
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
		{ schema: { params: taskIdSchema, body: workflowTaskApprovalSchema } },
		async (
			request: FastifyRequest<{ Params: TaskIdType; Body: WorkflowTaskApprovalType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			if (!uid) {
				return reply.code(401).send({
					success: false,
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
		{ schema: { params: taskIdSchema, body: workflowTaskRejectionSchema } },
		async (
			request: FastifyRequest<{ Params: TaskIdType; Body: WorkflowTaskRejectionType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			if (!uid) {
				return reply.code(401).send({
					success: false,
					message: "No uid extracted from access token",
				});
			}

			const { taskId } = request.params;
			const { minuteId } = request.body;

			const result = await workflowController.rejectTask(taskId, uid, minuteId);

			return reply.code(200).send({ success: true, data: result });
		},
	);
}

export default workflowRoutes;
