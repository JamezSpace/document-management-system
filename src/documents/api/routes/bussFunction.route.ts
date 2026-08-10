import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type BusinessFunctionController from "../controllers/businessFunction/BusinessFunctionController.js";
import {
	bussFunctionSchema,
	type BussFunctionType,
} from "../types/bussFunction.type.js";
import { routePolicies } from "../../../security/application/authorization.types.js";

async function businessFunctionRoutes(
	fastify: FastifyInstance,
	options: {
		controller: BusinessFunctionController;
	},
) {
    const businessFunctionController = options.controller;

	fastify.post(
		"/function",
		{
			config: {
				authorization: routePolicies.capability(
					"document.classification.manage",
				),
			},
			schema: { body: bussFunctionSchema },
		},
		async (
			request: FastifyRequest<{ Body: BussFunctionType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newBusinessFunction =
				await businessFunctionController.createBusinessFunction(
					request.actor!.staffId, payload
				);

			return reply.code(201).send({
				success: true,
				data: newBusinessFunction,
			});
        }
	);

	fastify.get(
		"/functions",
		{
			config: {
				authorization: routePolicies.capability("document.view"),
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			// fetch business functions
            const functions = await businessFunctionController.getAllBussFunctions();

            return reply.code(200).send({
                success: true,
                data: functions
            })
        },
	);
}

export default businessFunctionRoutes;
