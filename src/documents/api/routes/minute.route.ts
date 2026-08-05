import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ApiError from "../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../shared/errors/enum/api.enum.js";
import type MinuteController from "../controllers/minute/MinuteController.js";
import {
    documentIdSchema,
    documentMinuteParamsSchema,
    minuteSchemaForCreation,
    type DocumentIdSchemaType,
    type DocumentMinuteParamsSchemaType,
    type MinuteSchemaForCreationType,
} from "../types/minute.type.js";

async function minuteRoutes(
	fastify: FastifyInstance,
	options: { controller: MinuteController },
) {
	const minuteController = options.controller;

    // add a minute to a correspondence
	fastify.post(
		"/documents/:documentId/minutes",
		{ schema: { params: documentIdSchema, body: minuteSchemaForCreation } },
		async (
			request: FastifyRequest<{
				Params: DocumentIdSchemaType;
				Body: MinuteSchemaForCreationType;
			}>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			if (!uid) {
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});
			}

			const { documentId } = request.params;
			const payload = request.body;
			const minute = await minuteController.createMinute(documentId, payload);

			return reply.code(201).send({
				success: true,
				data: minute,
			});
		},
	);

    // fetch all minutes for a particular correspondence
	fastify.get(
		"/documents/:documentId/minutes",
		{ schema: { params: documentIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			if (!uid) {
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});
			}

			const { documentId } = request.params;
			const minutes = await minuteController.fetchMinutesByDocumentId(
				documentId,
			);

			return reply.code(200).send({
				success: true,
				data: minutes,
			});
		},
	);

    // get a specific minute for a specific correspondence
	fastify.get(
		"/documents/:documentId/minutes/:minuteId",
		{ schema: { params: documentMinuteParamsSchema } },
		async (
			request: FastifyRequest<{ Params: DocumentMinuteParamsSchemaType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			if (!uid) {
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});
			}

			const { documentId, minuteId } = request.params;
			const minute = await minuteController.fetchMinuteById(minuteId);

			if (!minute) {
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Minute with id: ${minuteId} doesn't exist`,
				});
			}

			if (minute.documentId !== documentId) {
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Minute with id: ${minuteId} doesn't exist for document ${documentId}`,
				});
			}

			return reply.code(200).send({
				success: true,
				data: minute,
			});
		},
	);
}

export default minuteRoutes;
