import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ApiError from "../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../shared/errors/enum/api.enum.js";
import type DocumentController from "../controllers/document/DocumentController.js";
import {
    docStaffIdSchema,
    documentIdSchema,
    documentSchema,
    documentSchemaForCreation,
    documentSchemaForSave,
    type DocStaffIdSchemaType,
    type DocumentIdSchemaType,
    type DocumentSchemaForSaveType,
    type DocumentSchemaType,
    type DocumentSchemaTypeForCreation,
} from "../types/document.type.js";
import type { DocumentIdentityPort } from "../../../shared/application/port/intersubsystem/DocumentIdentity.port.js";
import { routePolicies } from "../../../security/application/authorization.types.js";
import { DocumentCapabilities } from "../../domain/enum/documentCapabilities.enum.js";

async function documentRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DocumentController;
        documentIdentity: DocumentIdentityPort;
	},
) {
	const documentController = options.controller;

    // create a new document
	fastify.post(
		"/",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.CREATE),
			},
			schema: { body: documentSchemaForCreation },
		},
		async (
			request: FastifyRequest<{ Body: DocumentSchemaTypeForCreation }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;
			const actorStaffId = request.actor!.staffId;

			const newDocument =
				await documentController.createDocument(payload, actorStaffId);

			return reply.code(201).send({
				success: true,
				data: newDocument,
			});
		},
	);

	// fetch all docs authored by staff
	fastify.get(
		"/documents/:staffId",
		{
			config: { authorization: routePolicies.authenticatedSelf },
			schema: { params: docStaffIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocStaffIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const { staffId } = request.params;

			if (request.actor!.staffId !== staffId)
				throw new ApiError(ApiErrorEnum.NOT_ALLOWED, {
					message: "Staff may only access their own documents",
				});

			// fetch documents by staff
			const docsByStaff =
				await documentController.fetchAllDocsByStaff(staffId);

			return reply.code(200).send({
				success: true,
				data: docsByStaff,
			});
		},
	);

	// get a document with id
	fastify.get(
		"/:docId",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.VIEW),
			},
			schema: { params: documentIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const { docId } = request.params;

			// fetch document by id
			const doc = await documentController.fetchDocById(docId);

			if (!doc)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${docId} doesn't exist`,
				});

			return reply.code(200).send({
				success: true,
				data: doc,
			});
		},
	);

	// save document changes
	fastify.post(
		"/:docId/save",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.UPDATE),
			},
			schema: { params: documentIdSchema, body: documentSchemaForSave },
		},
		async (
			request: FastifyRequest<{
				Params: DocumentIdSchemaType;
				Body: DocumentSchemaForSaveType;
			}>,
			reply: FastifyReply,
		) => {
			const { docId } = request.params;
			const { contentDelta, document: documentToSave } = request.body;
			const actorStaffId = request.actor!.staffId;

			if (docId !== documentToSave.id)
				throw new ApiError(ApiErrorEnum.BAD_REQUEST, {
					message:
						"Mismatch between document ID input and id of the document!",
				});

			const savedDoc = await documentController.saveDocument(
				documentToSave,
				contentDelta,
				actorStaffId,
			);

			if (!savedDoc)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${docId} doesn't exist`,
				});

			return reply.status(200).send({
				success: true,
				data: savedDoc,
			});
		},
	);

	// submit document
	fastify.post(
		"/:staffId/submit",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.SUBMIT),
			},
			schema: { params: docStaffIdSchema, body: documentSchema },
		},
		async (
			request: FastifyRequest<{
				Params: DocStaffIdSchemaType;
                Body: DocumentSchemaType
			}>,
			reply: FastifyReply,
		) => {
			const { staffId } = request.params;
			const documentToSubmit = request.body;

			if (request.actor!.staffId !== staffId)
				throw new ApiError(ApiErrorEnum.NOT_ALLOWED, {
					message: "Staff may only submit documents as themselves",
				});
            
            const submitedDoc = await documentController.submitDocument(staffId, documentToSubmit);

			return reply.code(200).send({
                success: true,
                data: submitedDoc
            })
		},
	);

	// delete document
	fastify.delete(
		"/:docId",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.DELETE),
			},
			schema: { params: documentIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const { docId } = request.params;

			const deletedDoc = await documentController.deleteDocument(
				docId,
				request.actor!.staffId,
			);

			return reply.code(200).send({
				success: true,
				data: deletedDoc,
			});
		},
	);
}

export default documentRoutes;
