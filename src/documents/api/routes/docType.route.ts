import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type DocumentTypeController from "../controllers/documentType/DocumentTypeController.js";
import {
	docTypeCreationSchema,
	docTypeIdSchema,
	type DocTypeCreationType,
    type DocTypeIdSchemaType,
} from "../types/docType.type.js";
import { routePolicies } from "../../../security/application/type/authorization.type.js";
import { DocumentCapabilities } from "../../domain/enum/documentCapabilities.enum.js";

async function documentTypeRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DocumentTypeController;
	},
) {
	const docTypeController = options.controller;

	fastify.post(
		"/type",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.TYPE_MANAGE),
			},
			schema: { body: docTypeCreationSchema },
		},
		async (
			request: FastifyRequest<{ Body: DocTypeCreationType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newDocumentType = await docTypeController.createDocumentType(
				request.actor!.staffId,
				payload,
			);

			return reply.code(201).send({
				success: true,
				data: newDocumentType,
			});
		},
	);

    // all document types
	fastify.get(
		"/types",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.VIEW),
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			// fetch document types
            const docTypes = await docTypeController.getAllDocTypes();

            return reply.code(200).send({
                success: true,
                data: docTypes
            })
        });

    // fetch a specific document type
	fastify.get("/type/:typeId", {
		config: {
			authorization: routePolicies.capability(DocumentCapabilities.VIEW),
		},
		schema: { params: docTypeIdSchema },
	}, async(request: FastifyRequest<{Params: DocTypeIdSchemaType}>, reply: FastifyReply) => {
			const { typeId } = request.params;

			// fetch document type by id
			const docType =
				await docTypeController.getDocTypeById(typeId);

            return docType 
            ? 
			 reply.code(200).send({
				success: true,
				data: docType,
			}) :
            reply.code(404).send({
				success: true,
				data: null
			})
    })
}

export default documentTypeRoutes;
