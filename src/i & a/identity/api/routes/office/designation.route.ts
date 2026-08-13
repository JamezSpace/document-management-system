import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { routePolicies } from "../../../../../security/application/type/authorization.type.js";
import type DesignationController from "../../controllers/office/Designation.controller.js";
import {
    createDesignationSchema,
    editDesignationSchema,
    type CreateDesignationType,
    type EditDesignationType,
} from "../../types/office/office.type.js";
import { IdentityCapabilities } from "../../../domain/enum/identityCapabilities.enum.js";

async function officeDesignationRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DesignationController;
	},
) {
	const designationController = options.controller;

	// this gets all designations across all offices and units
	fastify.get(
		"/offices/designations",
		{ config: { authorization: routePolicies.authenticatedSelf } },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const officeDesignations =
				await designationController.getAllDesignations();

			return reply.code(200).send({
				success: true,
				data: officeDesignations,
			});
		},
	);

	// this gets all designations within an office
	fastify.get(
		"/office/:officeId/designations",
		{
			schema: { params: editDesignationSchema },
			config: { authorization: routePolicies.authenticatedSelf },
		},
		async (
			request: FastifyRequest<{ Params: EditDesignationType }>,
			reply: FastifyReply,
		) => {
			const officeId = request.params.officeId;

			const officeDesignations =
				await designationController.getAllDesignationsWithinAnOffice(
					officeId,
				);

			return reply.code(200).send({
				success: true,
				data: {
					officeName: officeDesignations.officeName,
					designations: officeDesignations.designations,
				},
			});
		},
	);

	fastify.post(
		"/office/designation",
		{
			schema: { body: createDesignationSchema },
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.ORGANIZATION_MANAGE,
				),
			},
		},
		async (
			request: FastifyRequest<{ Body: CreateDesignationType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newDesignation =
				await designationController.addNewDesignation(payload);

			return reply.code(201).send({
				success: true,
				data: newDesignation,
			});
		},
	);
}

export default officeDesignationRoutes;
