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
import { Type, type Static } from "@sinclair/typebox";

const attachmentBodySchema = Type.Object({
	mediaId: Type.String({ minLength: 1 }),
}, { additionalProperties: false });
const attachmentParamsSchema = Type.Object({
	docId: Type.String({ minLength: 1 }),
	mediaId: Type.String({ minLength: 1 }),
});
type AttachmentBody = Static<typeof attachmentBodySchema>;
type AttachmentParams = Static<typeof attachmentParamsSchema>;
const discoveryQuerySchema = Type.Object({
	query: Type.String({ minLength: 1, maxLength: 200 }),
	limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 25 })),
}, { additionalProperties: false });
const governanceGrantSchema = Type.Object({
	granteeStaffId: Type.String({ minLength: 1 }),
	grantType: Type.Union([Type.Literal("guest_reader"), Type.Literal("export")]),
	reason: Type.String({ minLength: 1, maxLength: 2000 }),
	validTo: Type.String({ format: "date-time" }),
	remainingUses: Type.Optional(Type.Union([Type.Integer({ minimum: 1 }), Type.Null()])),
}, { additionalProperties: false });
const grantParamsSchema = Type.Object({
	docId: Type.String({ minLength: 1 }),
	grantId: Type.String({ minLength: 1 }),
});
const reasonSchema = Type.Object({
	reason: Type.String({ minLength: 1, maxLength: 2000 }),
}, { additionalProperties: false });
const sensitivityRequestParamsSchema = Type.Object({
	docId: Type.String({ minLength: 1 }),
	requestId: Type.String({ minLength: 1 }),
});
type DiscoveryQuery = Static<typeof discoveryQuerySchema>;
type GovernanceGrantBody = Static<typeof governanceGrantSchema>;
type GrantParams = Static<typeof grantParamsSchema>;
type ReasonBody = Static<typeof reasonSchema>;
type SensitivityRequestParams = Static<typeof sensitivityRequestParamsSchema>;

async function documentRoutes(
	fastify: FastifyInstance,
	options: {
		controller: DocumentController;
		documentGovernancePolicy: DocumentGovernancePolicyPort;
	},
) {
	const documentController = options.controller;
	const sensitivitySchema = Type.Union(
		options.documentGovernancePolicy.getSensitivityLevels().map((level) => Type.Literal(level)),
	);
	const sensitivityChangeSchema = Type.Object({
		targetSensitivity: sensitivitySchema,
		reason: Type.String({ minLength: 1, maxLength: 2000 }),
	}, { additionalProperties: false });
	type SensitivityChangeBody = Static<typeof sensitivityChangeSchema>;

	fastify.get(
		"/",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.VIEW) },
			schema: { querystring: discoveryQuerySchema },
		},
		async (request: FastifyRequest<{ Querystring: DiscoveryQuery }>, reply: FastifyReply) => {
			const results = await documentController.discover(
				request.query.query,
				request.actor!.staffId,
				request.query.limit,
			);
			return reply.code(200).send({ success: true, data: results });
		},
	);

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

	fastify.post(
		"/:docId/attachments",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: documentIdSchema, body: attachmentBodySchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType; Body: AttachmentBody }>,
			reply: FastifyReply,
		) => {
			const attachments = await documentController.attachMedia(
				request.params.docId,
				request.body.mediaId,
				request.actor!.staffId,
			);
			return reply.code(201).send({ success: true, data: attachments });
		},
	);

	fastify.get(
		"/:docId/attachments",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.VIEW) },
			schema: { params: documentIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const attachments = await documentController.listAttachments(
				request.params.docId,
				request.actor!.staffId,
			);
			return reply.code(200).send({ success: true, data: attachments });
		},
	);

	fastify.post(
		"/:docId/unit-head-signature",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: documentIdSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType }>,
			reply: FastifyReply,
		) => {
			const signature = await documentController.signAsEffectiveUnitHead(
				request.params.docId,
				request.actor!.staffId,
			);
			return reply.code(201).send({ success: true, data: signature });
		},
	);

	fastify.post(
		"/:docId/governance/grants",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: documentIdSchema, body: governanceGrantSchema },
		},
		async (request: FastifyRequest<{ Params: DocumentIdSchemaType; Body: GovernanceGrantBody }>, reply: FastifyReply) => {
			const grant = await documentController.createGovernanceGrant(
				request.params.docId, request.body, request.actor!.staffId,
			);
			return reply.code(201).send({ success: true, data: grant });
		},
	);

	fastify.delete(
		"/:docId/governance/grants/:grantId",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: grantParamsSchema, body: reasonSchema },
		},
		async (request: FastifyRequest<{ Params: GrantParams; Body: ReasonBody }>, reply: FastifyReply) => {
			const result = await documentController.revokeGovernanceGrant(
				request.params.docId, request.params.grantId, request.body.reason, request.actor!.staffId,
			);
			return reply.code(200).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/:docId/governance/sensitivity-changes",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: documentIdSchema, body: sensitivityChangeSchema },
		},
		async (request: FastifyRequest<{ Params: DocumentIdSchemaType; Body: SensitivityChangeBody }>, reply: FastifyReply) => {
			const result = await documentController.requestSensitivityChange(
				request.params.docId, request.body.targetSensitivity, request.body.reason, request.actor!.staffId,
			);
			return reply.code(result.status === "applied" ? 200 : 202).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/:docId/governance/sensitivity-changes/:requestId/approve",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.APPROVE) },
			schema: { params: sensitivityRequestParamsSchema, body: reasonSchema },
		},
		async (request: FastifyRequest<{ Params: SensitivityRequestParams; Body: ReasonBody }>, reply: FastifyReply) => {
			const result = await documentController.approveSensitivityChange(
				request.params.docId, request.params.requestId, request.body.reason, request.actor!.staffId,
			);
			return reply.code(200).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/:docId/governance/sensitivity-changes/:requestId/reject",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.APPROVE) },
			schema: { params: sensitivityRequestParamsSchema, body: reasonSchema },
		},
		async (request: FastifyRequest<{ Params: SensitivityRequestParams; Body: ReasonBody }>, reply: FastifyReply) => {
			const result = await documentController.rejectSensitivityChange(
				request.params.docId, request.params.requestId, request.body.reason, request.actor!.staffId,
			);
			return reply.code(200).send({ success: true, data: result });
		},
	);

	fastify.delete(
		"/:docId/attachments/:mediaId",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: attachmentParamsSchema },
		},
		async (
			request: FastifyRequest<{ Params: AttachmentParams }>,
			reply: FastifyReply,
		) => {
			const removed = await documentController.removeAttachment(
				request.params.docId,
				request.params.mediaId,
				request.actor!.staffId,
			);
			return reply.code(200).send({ success: true, data: { removed } });
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
			const doc = await documentController.fetchDocById(
				docId,
				request.actor!.staffId,
			);

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
			const { contentDelta } = request.body;
			const actorStaffId = request.actor!.staffId;

			const savedDoc = await documentController.saveDocumentContent(
				docId,
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
