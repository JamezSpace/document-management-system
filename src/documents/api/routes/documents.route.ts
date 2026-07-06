import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ApiError from "../../../shared/errors/ApiError.error.js";
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

async function documentRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DocumentController;
        documentIdentity: DocumentIdentityPort;
	},
) {
	const documentController = options.controller;
	const documentIdentity = options.documentIdentity;

    // create a new document
    fastify.post(
		"/",
		{ schema: { body: documentSchemaForCreation } },
		async (
			request: FastifyRequest<{ Body: DocumentSchemaTypeForCreation }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newDocument =
				await documentController.createDocument(payload);

			return reply.code(201).send({
				success: true,
				data: newDocument,
			});
		},
	);

	// fetch all docs authored by staff
	fastify.get(
		"/documents/:staffId",
		{ schema: { params: docStaffIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocStaffIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			const { staffId } = request.params;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

            // ensuring row-level security
            const authenticatedStaff = await documentIdentity.getStaffByUid(uid);

            if(!authenticatedStaff)
                throw new ApiError(ApiErrorEnum.NOT_FOUND, {
                    message: 'Staff does not exist!'
                })
            
            if(authenticatedStaff.id !== staffId)
                throw new ApiError(ApiErrorEnum.NOT_ALLOWED, {
                    message: "Forbidden Access"
                })
            

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
		{ schema: { params: documentIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			const { docId } = request.params;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

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
		{ schema: { params: documentIdSchema, body: documentSchemaForSave } },
		async (
			request: FastifyRequest<{
				Params: DocumentIdSchemaType;
				Body: DocumentSchemaForSaveType;
			}>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			const { docId } = request.params;
			const { contentDelta, document: documentToSave, actorId } = request.body;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			if (docId !== documentToSave.id)
				throw new ApiError(ApiErrorEnum.BAD_REQUEST, {
					message:
						"Mismatch between document ID input and id of the document!",
				});

			const savedDoc = await documentController.saveDocument(
				documentToSave,
				contentDelta,
                actorId
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
		{ schema: { params: docStaffIdSchema, body: documentSchema } },
		async (
			request: FastifyRequest<{
				Params: DocStaffIdSchemaType;
                Body: DocumentSchemaType
			}>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			const { staffId } = request.params;
            const documentToSubmit = request.body;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
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
		{ schema: { params: documentIdSchema } },
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;
			const { docId } = request.params;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			const deletedDoc = await documentController.deleteDocument(docId, uid);

			return reply.code(200).send({
				success: true,
				data: deletedDoc,
			});
		},
	);
}

export default documentRoutes;
