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
import { routePolicies } from "../../../security/application/authorization.types.js";

async function workflowRoutes(
	fastify: FastifyInstance,
	options: { controller: WorkflowController },
) {
	const workflowController = options.controller;

	fastify.get(
		"/documents/:documentId",
		{
			config: {
				authorization: routePolicies.capability("document.view"),
			},
			schema: { params: documentIdSchema },
		},
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
		{
			config: {
				authorization: routePolicies.capability("document.approve"),
			},
			schema: { params: taskIdSchema, body: workflowTaskApprovalSchema },
		},
		async (
			request: FastifyRequest<{ Params: TaskIdType; Body: WorkflowTaskApprovalType }>,
			reply: FastifyReply,
		) => {
			const { taskId } = request.params;
			const { minuteId } = request.body;

			const result = await workflowController.approveTask(
				taskId,
				request.actor!.staffId,
				minuteId ?? null,
			);

			return reply.code(200).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/tasks/:taskId/reject",
		{
			config: {
				authorization: routePolicies.capability("document.reject"),
			},
			schema: { params: taskIdSchema, body: workflowTaskRejectionSchema },
		},
		async (
			request: FastifyRequest<{ Params: TaskIdType; Body: WorkflowTaskRejectionType }>,
			reply: FastifyReply,
		) => {
			const { taskId } = request.params;
			const { minuteId } = request.body;

			const result = await workflowController.rejectTask(
				taskId,
				request.actor!.staffId,
				minuteId,
			);

			return reply.code(200).send({ success: true, data: result });
		},
	);
}

export default workflowRoutes;
