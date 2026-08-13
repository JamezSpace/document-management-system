import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type InvitesController from "../../controllers/user/Invites.controller.js";
import { initInviteSchema, inviteIdSchema, type InitInviteType, type InviteIdType } from "../../types/user/user.type.js";
import { IdentityCapabilities } from "../../../domain/enum/identityCapabilities.enum.js";
import { routePolicies } from "../../../../../security/application/type/authorization.type.js";

async function inviteRoutes(
	fastify: FastifyInstance,
	options: { controller: InvitesController },
) {
	const invitesController = options.controller;

    // see all invites
	fastify.get(
		"/invites",
		{
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.STAFF_PENDING_ACTIVATION_LIST,
				),
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { uid } = request.user!;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			const allInvites = await invitesController.getAllInvites();

			return reply.code(200).send({
				success: true,
				data: allInvites,
			});
		},
	);

    // create an invite
    fastify.post("/invite", {
		schema: { body: initInviteSchema },
		config: {
			authorization: routePolicies.capability(
				IdentityCapabilities.STAFF_CREATE,
			),
		},
	}, async (request: FastifyRequest<{Body: InitInviteType}>, reply: FastifyReply) => {
            // extract information from request body
            const payload = request.body;
    
            const inviteResult = await invitesController.initInvite(payload);
    
            return reply.code(201).send({
                    success: true,
                    data: inviteResult.inviteId,
                });
        })

    // nudge an invite
    fastify.post(
        "/invite/nudge/:inviteId",
		{
			schema: { params: inviteIdSchema },
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.STAFF_UPDATE,
				),
			},
		},
        async(request: FastifyRequest<{Params: InviteIdType}>, reply: FastifyReply) => {
            const { uid } = request.user!;
            const { inviteId } = request.params;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

            const status = await invitesController.nudgeInvite(inviteId);
            
            return status ? reply.code(200).send({
                success: true,
                data: {
                    message: "Invite has been nudged"
                }
            }) : reply.code(500).send({
                success: true,
                data: {
                    message: "Invite nudge failed"
                }
            })
        }
    )
}

export default inviteRoutes;
