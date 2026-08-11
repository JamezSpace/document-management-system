import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type CorrespondenceSubjectController from "../controllers/correspondenceSubject/CorrespondenceSubjectController.js";
import {
	corrSubjectSchema,
	type CorrSubjectType,
} from "../types/corrSubject.type.js";
import { routePolicies } from "../../../security/application/authorization.types.js";
import { DocumentCapabilities } from "../../domain/enum/documentCapabilities.enum.js";

async function correspondenceSubjectRoutes(
	fastify: FastifyInstance,
	options: {
		controller: CorrespondenceSubjectController;
	},
) {
	const correspondenceSubjectController = options.controller;

	fastify.post(
		"/subject",
		{
			config: {
				authorization: routePolicies.capability(
					DocumentCapabilities.CLASSIFICATION_MANAGE,
				),
			},
			schema: { body: corrSubjectSchema },
		},
		async (
			request: FastifyRequest<{ Body: CorrSubjectType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newCorrSubject =
				await correspondenceSubjectController.createCorrespondenceSubject(
					payload,
				);

			return reply.code(201).send({
				success: true,
				corrSubject: newCorrSubject,
			});
		},
	);

	fastify.get(
		"/subjects",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.VIEW),
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			// fetch correspondence subjects
            const subjects = await correspondenceSubjectController.getAllCorrSubjects();

            return reply.code(200).send({
                success: true,
                data: subjects
            })
        },
	);
}

export default correspondenceSubjectRoutes;
