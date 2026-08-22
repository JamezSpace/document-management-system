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
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";

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
	cursor: Type.Optional(Type.String({ minLength: 1 })),
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
const mutationHeadersSchema = Type.Object({
	"if-match": Type.String({ minLength: 1 }),
}, { additionalProperties: true });
const pagedQuerySchema = Type.Object({
	limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 25 })),
	cursor: Type.Optional(Type.String({ minLength: 1 })),
}, { additionalProperties: false });
const extractionParamsSchema = Type.Object({
	docId: Type.String({ minLength: 1 }),
	action: Type.Union([Type.Literal("export"), Type.Literal("print")]),
});
type MutationHeaders = Static<typeof mutationHeadersSchema>;
type PagedQuery = Static<typeof pagedQuerySchema>;
type ExtractionParams = Static<typeof extractionParamsSchema>;

function expectedRevision(headers: MutationHeaders) {
	const normalized = headers["if-match"].trim().replace(/^W\//, "").replace(/^"|"$/g, "");
	const revision = Number(normalized);
	if (!Number.isSafeInteger(revision) || revision < 1) {
		throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
			message: "If-Match must contain a positive document revision",
		});
	}
	return revision;
}

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
				request.query.cursor,
			);
			return reply.code(200).send({ success: true, data: results });
		},
	);

	fastify.get(
		"/governance/sensitivity-changes",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.APPROVE) },
			schema: { querystring: pagedQuerySchema },
		},
		async (request: FastifyRequest<{ Querystring: PagedQuery }>, reply: FastifyReply) => {
			const queue = await documentController.sensitivityApprovalQueue(
				request.actor!.staffId, request.query.limit, request.query.cursor,
			);
			return reply.code(200).send({ success: true, data: queue });
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

			return reply.header("ETag", `\"${newDocument.revision}\"`).code(201).send({
				success: true,
				data: newDocument,
			});
		},
	);

	fastify.post(
		"/:docId/attachments",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: documentIdSchema, body: attachmentBodySchema, headers: mutationHeadersSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType; Body: AttachmentBody; Headers: MutationHeaders }>,
			reply: FastifyReply,
		) => {
			const attachments = await documentController.attachMedia(
				request.params.docId,
				request.body.mediaId,
				request.actor!.staffId,
				expectedRevision(request.headers),
			);
			return reply.header("ETag", `\"${attachments.documentRevision}\"`).code(201).send({ success: true, data: attachments });
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
			schema: { params: documentIdSchema, headers: mutationHeadersSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType; Headers: MutationHeaders }>,
			reply: FastifyReply,
		) => {
			const signature = await documentController.signAsEffectiveUnitHead(
				request.params.docId,
				request.actor!.staffId,
				expectedRevision(request.headers),
			);
			return reply.header("ETag", `\"${signature.documentRevision}\"`).code(201).send({ success: true, data: signature });
		},
	);

	fastify.post(
		"/:docId/governance/grants",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: documentIdSchema, body: governanceGrantSchema, headers: mutationHeadersSchema },
		},
		async (request: FastifyRequest<{ Params: DocumentIdSchemaType; Body: GovernanceGrantBody; Headers: MutationHeaders }>, reply: FastifyReply) => {
			const grant = await documentController.createGovernanceGrant(
				request.params.docId, request.body, request.actor!.staffId, expectedRevision(request.headers),
			);
			return reply.header("ETag", `\"${grant.documentRevision}\"`).code(201).send({ success: true, data: grant });
		},
	);

	fastify.get(
		"/:docId/governance/grants",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.VIEW) },
			schema: { params: documentIdSchema },
		},
		async (request: FastifyRequest<{ Params: DocumentIdSchemaType }>, reply: FastifyReply) => {
			const grants = await documentController.listGovernanceGrants(request.params.docId, request.actor!.staffId);
			return reply.code(200).send({ success: true, data: grants });
		},
	);

	fastify.delete(
		"/:docId/governance/grants/:grantId",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: grantParamsSchema, body: reasonSchema, headers: mutationHeadersSchema },
		},
		async (request: FastifyRequest<{ Params: GrantParams; Body: ReasonBody; Headers: MutationHeaders }>, reply: FastifyReply) => {
			const result = await documentController.revokeGovernanceGrant(
				request.params.docId, request.params.grantId, request.body.reason, request.actor!.staffId, expectedRevision(request.headers),
			);
			return reply.header("ETag", `\"${result.documentRevision}\"`).code(200).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/:docId/governance/sensitivity-changes",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: documentIdSchema, body: sensitivityChangeSchema, headers: mutationHeadersSchema },
		},
		async (request: FastifyRequest<{ Params: DocumentIdSchemaType; Body: SensitivityChangeBody; Headers: MutationHeaders }>, reply: FastifyReply) => {
			const result = await documentController.requestSensitivityChange(
				request.params.docId, request.body.targetSensitivity, request.body.reason, request.actor!.staffId, expectedRevision(request.headers),
			);
			return reply.header("ETag", `\"${result.documentRevision}\"`).code(result.status === "applied" ? 200 : 202).send({ success: true, data: result });
		},
	);

	fastify.get(
		"/:docId/governance/sensitivity-changes",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.VIEW) },
			schema: { params: documentIdSchema },
		},
		async (request: FastifyRequest<{ Params: DocumentIdSchemaType }>, reply: FastifyReply) => {
			const requests = await documentController.listSensitivityChanges(request.params.docId, request.actor!.staffId);
			return reply.code(200).send({ success: true, data: requests });
		},
	);

	fastify.post(
		"/:docId/governance/sensitivity-changes/:requestId/approve",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.APPROVE) },
			schema: { params: sensitivityRequestParamsSchema, body: reasonSchema, headers: mutationHeadersSchema },
		},
		async (request: FastifyRequest<{ Params: SensitivityRequestParams; Body: ReasonBody; Headers: MutationHeaders }>, reply: FastifyReply) => {
			const result = await documentController.approveSensitivityChange(
				request.params.docId, request.params.requestId, request.body.reason, request.actor!.staffId, expectedRevision(request.headers),
			);
			return reply.header("ETag", `\"${result.documentRevision}\"`).code(200).send({ success: true, data: result });
		},
	);

	fastify.post(
		"/:docId/governance/sensitivity-changes/:requestId/reject",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.APPROVE) },
			schema: { params: sensitivityRequestParamsSchema, body: reasonSchema, headers: mutationHeadersSchema },
		},
		async (request: FastifyRequest<{ Params: SensitivityRequestParams; Body: ReasonBody; Headers: MutationHeaders }>, reply: FastifyReply) => {
			const result = await documentController.rejectSensitivityChange(
				request.params.docId, request.params.requestId, request.body.reason, request.actor!.staffId, expectedRevision(request.headers),
			);
			return reply.header("ETag", `\"${result.documentRevision}\"`).code(200).send({ success: true, data: result });
		},
	);

	fastify.delete(
		"/:docId/attachments/:mediaId",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.UPDATE) },
			schema: { params: attachmentParamsSchema, headers: mutationHeadersSchema },
		},
		async (
			request: FastifyRequest<{ Params: AttachmentParams; Headers: MutationHeaders }>,
			reply: FastifyReply,
		) => {
			const removed = await documentController.removeAttachment(
				request.params.docId,
				request.params.mediaId,
				request.actor!.staffId,
				expectedRevision(request.headers),
			);
			if (removed && typeof removed === "object") reply.header("ETag", `\"${removed.documentRevision}\"`);
			return reply.code(200).send({ success: true, data: removed });
		},
	);

	fastify.post(
		"/:docId/extractions/:action",
		{
			config: { authorization: routePolicies.capability(DocumentCapabilities.VIEW) },
			schema: { params: extractionParamsSchema, headers: mutationHeadersSchema },
		},
		async (request: FastifyRequest<{ Params: ExtractionParams; Headers: MutationHeaders }>, reply: FastifyReply) => {
			const extraction = await documentController.renderExtraction(
				request.params.docId, request.actor!.staffId, request.params.action, expectedRevision(request.headers),
			);
			return reply
				.header("Content-Type", extraction.contentType)
				.header("Content-Disposition", `${extraction.disposition}; filename=\"${extraction.fileName}\"`)
				.header("ETag", `\"${extraction.documentRevision}\"`)
				.header("X-Artifact-SHA256", extraction.artifactSha256)
				.header("X-Governance-Policy", `${extraction.policyId};version=${extraction.policyVersion}`)
				.header("X-Governance-Obligations", extraction.obligations.join(","))
				.send(extraction.artifact);
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

			return reply.header("ETag", `\"${doc.revision}\"`).code(200).send({
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
			schema: { params: documentIdSchema, body: documentSchemaForSave, headers: mutationHeadersSchema },
		},
		async (
			request: FastifyRequest<{
				Params: DocumentIdSchemaType;
				Body: DocumentSchemaForSaveType;
				Headers: MutationHeaders;
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
				expectedRevision(request.headers),
			);

			if (!savedDoc)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${docId} doesn't exist`,
				});

			return reply.header("ETag", `\"${savedDoc.revision}\"`).status(200).send({
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
				headers: mutationHeadersSchema,
			},
		},
		async (
			request: FastifyRequest<{
				Params: DocumentIdSchemaType;
				Body: SaveDocumentContentCommandType;
				Headers: MutationHeaders;
			}>,
			reply: FastifyReply,
		) => {
			const savedDocument = await documentController.saveDocumentContent(
				request.params.docId,
				request.body.contentDelta,
				request.actor!.staffId,
				expectedRevision(request.headers),
			);

			if (!savedDocument)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${request.params.docId} doesn't exist`,
				});

			return reply.header("ETag", `\"${savedDocument.revision}\"`).code(200).send({ success: true, data: savedDocument });
		},
	);

	// Submit by resource id; actor identity and document state are server-owned.
	fastify.post(
		"/:docId/submit",
		{
			config: {
				authorization: routePolicies.capability(DocumentCapabilities.SUBMIT),
			},
			schema: { params: documentIdSchema, headers: mutationHeadersSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType; Headers: MutationHeaders }>,
			reply: FastifyReply,
		) => {
			const submittedDocument = await documentController.submitDocumentById(
				request.params.docId,
				request.actor!.staffId,
				expectedRevision(request.headers),
			);

			if (!submittedDocument)
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Document with id: ${request.params.docId} doesn't exist`,
				});

			return reply.header("ETag", `\"${submittedDocument.revision}\"`).code(200).send({
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
			schema: { params: documentIdSchema, headers: mutationHeadersSchema },
		},
		async (
			request: FastifyRequest<{ Params: DocumentIdSchemaType; Headers: MutationHeaders }>,
			reply: FastifyReply,
		) => {
			const { docId } = request.params;

			const deletedDoc = await documentController.deleteDocument(
				docId,
				request.actor!.staffId,
				expectedRevision(request.headers),
			);

			return reply.code(200).send({
				success: true,
				data: deletedDoc,
			});
		},
	);
}

export default documentRoutes;
