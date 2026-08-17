import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import OrgUnitController from "../../controllers/organizationalUnit/OrganizationUnit.controller.js";
import { createOrgUnitSchema, type CreateOrgUnitType } from "../../types/unit/orgUnit.type.js";
import { IdentityCapabilities } from "../../../domain/enum/identityCapabilities.enum.js";
import { routePolicies } from "../../../../../security/application/type/authorization.type.js";

async function orgUnitRoutes(
	fastify: FastifyInstance,
	options: { controller: OrgUnitController },
) {
	const orgController = options.controller;

	fastify.get(
		"/units",
		{ config: { authorization: routePolicies.authenticatedSelf } },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const units = await orgController.getAllUnits();

			return reply.code(200).send({
				success: true,
				data: units,
			});
		},
	);

	fastify.post(
		"/unit",
		{
			schema: { body: createOrgUnitSchema },
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.ORGANIZATION_MANAGE,
				),
			},
		},
		async (
			request: FastifyRequest<{ Body: CreateOrgUnitType }>,
			reply: FastifyReply,
		) => {
            const payload = request.body;

            const newUnit = await orgController.addNewUnit(payload);

            return reply.code(201).send({
                success: true,
                data: newUnit
            });
        }
	);
}

export default orgUnitRoutes;
