import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { routePolicies } from "../../../../security/application/authorization.types.js";
import type RoleAssignmentController from "../controllers/RoleAssignment.controller.js";
import {
	assignRoleSchema,
	delegateRoleSchema,
	roleAssignmentIdSchema,
	roleAssignmentStaffIdSchema,
	type AssignRoleType,
	type DelegateRoleType,
	type RoleAssignmentIdType,
	type RoleAssignmentStaffIdType,
} from "../types/roleAssignment.type.js";

async function roleAssignmentRoutes(
	fastify: FastifyInstance,
	options: { controller: RoleAssignmentController },
) {
	const controller = options.controller;

	fastify.post(
		"/role-assignments",
		{
			config: { authorization: routePolicies.capability("role.assign") },
			schema: { body: assignRoleSchema },
		},
		async (
			request: FastifyRequest<{ Body: AssignRoleType }>,
			reply: FastifyReply,
		) => {
			const assignment = await controller.assign(
				request.body,
				request.actor!.staffId,
			);
			return reply.code(201).send({ success: true, data: assignment });
		},
	);

	fastify.get(
		"/role-assignments/staff/:staffId",
		{
			config: { authorization: routePolicies.capability("role.view") },
			schema: { params: roleAssignmentStaffIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: RoleAssignmentStaffIdType }>,
			reply: FastifyReply,
		) => {
			const assignments = await controller.listForStaff(
				request.params.staffId,
			);
			return reply.code(200).send({ success: true, data: assignments });
		},
	);

	fastify.post(
		"/role-assignments/:assignmentId/delegations",
		{
			config: { authorization: routePolicies.capability("role.assign") },
			schema: {
				params: roleAssignmentIdSchema,
				body: delegateRoleSchema,
			},
		},
		async (
			request: FastifyRequest<{
				Params: RoleAssignmentIdType;
				Body: DelegateRoleType;
			}>,
			reply: FastifyReply,
		) => {
			const assignment = await controller.delegate(
				request.params.assignmentId,
				request.body,
				request.actor!.staffId,
			);
			return reply.code(201).send({ success: true, data: assignment });
		},
	);

	fastify.post(
		"/role-assignments/:assignmentId/revoke",
		{
			config: { authorization: routePolicies.capability("role.remove") },
			schema: { params: roleAssignmentIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: RoleAssignmentIdType }>,
			reply: FastifyReply,
		) => {
			const assignment = await controller.revoke(
				request.params.assignmentId,
				request.actor!.staffId,
			);
			return reply.code(200).send({ success: true, data: assignment });
		},
	);
}

export default roleAssignmentRoutes;
