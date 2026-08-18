import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ApiError from "../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../shared/errors/enum/api.enum.js";
import type DocumentController from "../controllers/document/DocumentController.js";
import {
    docStaffIdSchema,
    documentIdSchema,
	createDocumentSchemaForCreation,
    documentSchemaForSave,
	saveDocumentContentCommandSchema,
    type DocStaffIdSchemaType,
    type DocumentIdSchemaType,
    type DocumentSchemaForSaveType,
    type DocumentSchemaTypeForCreation,
	type SaveDocumentContentCommandType,
} from "../types/document.type.js";
import type { DocumentGovernancePolicyPort } from "../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import { routePolicies } from "../../../security/application/type/authorization.type.js";
import { DocumentCapabilities } from "../../domain/enum/documentCapabilities.enum.js";

async function documentRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DocumentController;
		documentGovernancePolicy: DocumentGovernancePolicyPort;
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
			schema: {
				body: createDocumentSchemaForCreation(
					options.documentGovernancePolicy.getSensitivityLevels(),
				),
			},
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

	// Save editor content using the authenticated actor and server-owned document state.
	fastify.patch(
		"/:docId/content",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.UPDATE),
			},
			schema: {
				params: documentIdSchema,
				body: saveDocumentContentCommandSchema,
			},
		},
		async (
			request: FastifyRequest<{
				Params: DocumentIdSchemaType;
				Body: SaveDocumentContentCommandType;
			}>,
			reply: FastifyReply,
		) => {
			const savedDocument = await documentController.saveDocumentContent(
				request.params.docId,
				request.body.contentDelta,
				request.actor!.staffId,
			);

			if (!savedDocument)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${request.params.docId} doesn't exist`,
				});

			return reply.code(200).send({ success: true, data: savedDocument });
		},
	);

	// Submit by resource id; actor identity and document state are server-owned.
	fastify.post(
		"/:docId/submit",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.SUBMIT),
			},
			schema: { params: documentIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const submittedDocument = await documentController.submitDocumentById(
				request.params.docId,
				request.actor!.staffId,
			);

			if (!submittedDocument)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${request.params.docId} doesn't exist`,
				});

			return reply.code(200).send({
				success: true,
				data: submittedDocument,
			});
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
