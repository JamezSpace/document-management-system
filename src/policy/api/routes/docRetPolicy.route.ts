import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DocumentRetentionPolicyController from "../controllers/DocumentRetentionPolicyController.js";
import {
    createDocumentRetentionPolicySchema,
    type CreateDocumentRetentionPolicyType,
} from "../types/docRetPolicy.type.js";
import { routePolicies } from "../../../security/application/authorization.types.js";
import { RecordsCapabilities } from "../../../records/domain/enum/recordsCapabilities.enum.js";

async function documentRetentionPolicyRoutes(
    fastify: FastifyInstance,
    options: {
        controller: DocumentRetentionPolicyController;
    },
) {
    const documentRetentionPolicyController = options.controller;

    fastify.post(
        "/retention",
        {
            config: {
                authorization: routePolicies.capability(
                    RecordsCapabilities.RETENTION_MANAGE,
                ),
            },
            schema: { body: createDocumentRetentionPolicySchema },
        },
        async (
            request: FastifyRequest<{ Body: CreateDocumentRetentionPolicyType }>,
            reply: FastifyReply,
        ) => {
            const payload = request.body;

            const newPolicy =
                await documentRetentionPolicyController.createDocumentRetentionPolicy(
					request.actor!.staffId,
                    payload
                );

            return reply.code(201).send({
                success: true,
                data: newPolicy
            });
        },
    );
}

export default documentRetentionPolicyRoutes;
