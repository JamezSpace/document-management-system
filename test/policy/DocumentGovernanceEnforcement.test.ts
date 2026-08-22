import { strict as assert } from "node:assert";
import { test } from "node:test";

import DocumentGovernanceGuard from "../../src/documents/application/services/DocumentGovernanceGuard.service.js";
import ManageDocumentAttachmentUseCase from "../../src/documents/application/usecases/document/ManageDocumentAttachment.usecase.js";
import DocumentCanvasProjector from "../../src/orchestration/workspace/application/services/DocumentCanvasProjector.js";
import type { DocumentGovernancePolicyPort } from "../../src/shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import DocumentGovernanceObligationExecutor from "../../src/documents/application/services/DocumentGovernanceObligationExecutor.service.js";
import DiscoverDocumentsUseCase from "../../src/documents/application/usecases/document/DiscoverDocuments.usecase.js";
import RenderDocumentExtractionUseCase from "../../src/documents/application/usecases/document/RenderDocumentExtraction.usecase.js";
import ApplicationError from "../../src/shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../src/shared/errors/enum/application.enum.js";

const policyReference = {
	policyId: "nexusfons_document_governance",
	policyVersion: 2,
};
const context = {
	relationships: ["author"] as Array<"author">,
	isAuthenticatedInternalStaff: true,
	hasRequiredClearance: true,
	hasActiveGuestReaderGrant: false,
	hasEffectiveUnitHeadSignature: true,
	exportGrant: null,
};
const obligations = new DocumentGovernanceObligationExecutor({ record: async () => undefined });

function documentFixture(sensitivity: "public" | "internal" | "confidential" | "restricted") {
	return {
		id: "DOC-1",
		ownerId: "STAFF-1",
		title: "Policy test",
		referenceNumber: "REF-1",
		addressees: [
			{ recipientUnitId: "UNIT-1", addressedToDesignationId: "DESIG-1", isPrimary: true },
			{ recipientUnitId: "UNIT-2", addressedToDesignationId: "DESIG-2", isPrimary: false },
		],
		classification: {
			sensitivity,
			governancePolicyKey: policyReference.policyId,
			governancePolicyVersion: policyReference.policyVersion,
		},
		correspondence: { direction: "external" },
		retention: {},
		createdAt: new Date("2026-08-20T00:00:00.000Z"),
		getCurrentVersion: () => null,
	} as any;
}

const canvasPolicy: DocumentGovernancePolicyPort = {
	getSensitivityLevels: () => ["public", "internal", "confidential", "restricted"],
	getActivePolicyReference: async () => policyReference,
	evaluateAction: async (action, facts) => {
		let allowed = true;
		if (action === "render_cc_header") {
			allowed = facts.sensitivity === "public" ||
				(facts.sensitivity === "internal" && facts.isInternalCanvas === true) ||
				(facts.sensitivity === "restricted" && facts.relationships?.includes("primary_authorizing_desk") === true);
		}
		if (action === "attach") {
			allowed = facts.sensitivity === "public" ||
				(facts.sensitivity === "internal" && facts.hasEffectiveUnitHeadSignature === true);
		}
		return { allowed, ...policyReference, reasonCode: allowed ? "allowed" : "denied", obligations: [] };
	},
};

test("canvas projection removes confidential CC data before serialization", async () => {
	const projected = await DocumentCanvasProjector.project(
		documentFixture("confidential"),
		"internal",
		context,
		canvasPolicy,
	);
	assert.equal(projected.ccHeader.visible, false);
	assert.equal(projected.document.addressees.length, 1);
	assert.equal(projected.document.addressees[0]!.isPrimary, true);
});

test("canvas projection distinguishes public letterhead and internal routing views", async () => {
	const publicCanvas = await DocumentCanvasProjector.project(
		documentFixture("public"), "letterhead", context, canvasPolicy,
	);
	const internalLetterhead = await DocumentCanvasProjector.project(
		documentFixture("internal"), "letterhead", context, canvasPolicy,
	);
	assert.equal(publicCanvas.ccHeader.placement, "letterhead_footer");
	assert.equal(publicCanvas.document.addressees.length, 2);
	assert.equal(internalLetterhead.ccHeader.visible, false);
	assert.equal(internalLetterhead.document.addressees.length, 1);
});

test("attachment command denies confidential bindings before persistence", async () => {
	let attachmentWasSaved = false;
	const governance = new DocumentGovernanceGuard(canvasPolicy, {
		hasRestrictedClearance: async () => true,
		resolve: async () => context,
	}, obligations);
	const useCase = new ManageDocumentAttachmentUseCase(
		{ findDocumentById: async () => documentFixture("confidential") } as any,
		{
			mediaExistsForUploader: async () => true,
			save: async () => { attachmentWasSaved = true; },
			listByDocument: async () => [],
			remove: async () => false,
		} as any,
		governance,
		{ execute: async (operation: any) => operation({ client: {} }) } as any,
	);

	await assert.rejects(
		useCase.attach({ documentId: "DOC-1", mediaId: "MEDIA-1", actorStaffId: "STAFF-1", expectedRevision: 1 }),
		(error: any) => error.errorCode === "not_allowed",
	);
	assert.equal(attachmentWasSaved, false);
});

test("attachment command requires Unit Head signature evidence for internal documents", async () => {
	let attachmentWasSaved = false;
	const unsignedContext = { ...context, hasEffectiveUnitHeadSignature: false };
	const governance = new DocumentGovernanceGuard(canvasPolicy, {
		hasRestrictedClearance: async () => true,
		resolve: async () => unsignedContext,
	}, obligations);
	const useCase = new ManageDocumentAttachmentUseCase(
		{ findDocumentById: async () => documentFixture("internal") } as any,
		{
			mediaExistsForUploader: async () => true,
			save: async () => { attachmentWasSaved = true; },
			listByDocument: async () => [],
			remove: async () => false,
		} as any,
		governance,
		{ execute: async (operation: any) => operation({ client: {} }) } as any,
	);

	await assert.rejects(
		useCase.attach({ documentId: "DOC-1", mediaId: "MEDIA-1", actorStaffId: "STAFF-1", expectedRevision: 1 }),
		(error: any) => error.errorCode === "not_allowed",
	);
	assert.equal(attachmentWasSaved, false);
});

test("attachment command binds requester-owned media for a public draft", async () => {
	let savedPayload: unknown = null;
	const governance = new DocumentGovernanceGuard(canvasPolicy, {
		hasRestrictedClearance: async () => true,
		resolve: async () => context,
	}, obligations);
	const useCase = new ManageDocumentAttachmentUseCase(
		{ findDocumentById: async () => documentFixture("public"), incrementRevision: async () => 2 } as any,
		{
			mediaExistsForUploader: async () => true,
			save: async (payload: unknown) => { savedPayload = payload; },
			listByDocument: async () => [],
			remove: async () => false,
		} as any,
		governance,
		{ execute: async (operation: any) => operation({ client: {} }) } as any,
	);

	await useCase.attach({ documentId: "DOC-1", mediaId: "MEDIA-1", actorStaffId: "STAFF-1", expectedRevision: 1 });
	assert.deepEqual(savedPayload, {
		documentId: "DOC-1",
		documentVersionId: null,
		mediaId: "MEDIA-1",
		assetRole: "attachment",
	});
});

test("discovery silently removes policy-denied candidates", async () => {
	const auditEvents: Array<{ outcome: string; documentId: string }> = [];
	const discoveryPolicy: DocumentGovernancePolicyPort = {
		...canvasPolicy,
		evaluateAction: async (_action, facts) => ({
			allowed: facts.sensitivity === "public",
			...policyReference,
			reasonCode: facts.sensitivity === "public" ? "public_access" : "confidential_denied",
			obligations: facts.sensitivity === "public" ? [] : ["audit_security_event"],
		}),
	};
	const guard = new DocumentGovernanceGuard(
		discoveryPolicy,
		{ hasRestrictedClearance: async () => false, resolve: async () => context },
		new DocumentGovernanceObligationExecutor({
			record: async (event) => { auditEvents.push({ outcome: event.outcome, documentId: event.documentId }); },
		}),
	);
	const useCase = new DiscoverDocumentsUseCase({
		discover: async () => [documentFixture("public"), { ...documentFixture("confidential"), id: "DOC-2" }],
	} as any, guard);

	const result = await useCase.execute("policy", "STAFF-1", 10);
	assert.deepEqual(result.items.map((item) => item.id), ["DOC-1"]);
	assert.deepEqual(auditEvents, [{ outcome: "denied", documentId: "DOC-2" }]);
});

test("an expired confidential guest-reader grant returns its stable access error", async () => {
	const deniedPolicy: DocumentGovernancePolicyPort = {
		...canvasPolicy,
		evaluateAction: async () => ({
			allowed: false,
			...policyReference,
			reasonCode: "confidential_explicit_access_required",
			obligations: ["audit_security_event"],
		}),
	};
	const guard = new DocumentGovernanceGuard(deniedPolicy, {
		hasRestrictedClearance: async () => false,
		resolve: async () => ({
			...context,
			relationships: [],
			guestReaderGrantStatus: "expired",
		}),
	}, obligations);

	await assert.rejects(
		guard.authorize(documentFixture("confidential"), "STAFF-2", "view"),
		(error: any) => error.errorCode === "governance_grant_expired",
	);
});

test("obligation executor writes security audits for allowed sensitive operations", async () => {
	const events: unknown[] = [];
	const executor = new DocumentGovernanceObligationExecutor({
		record: async (event) => { events.push(event); },
	});
	await executor.execute({
		decision: {
			allowed: true,
			...policyReference,
			reasonCode: "confidential_explicit_access",
			obligations: ["audit_security_event"],
		},
		actorStaffId: "STAFF-1",
		documentId: "DOC-1",
		action: "view",
		outcome: "success",
	});
	assert.equal(events.length, 1);
});

test("server extraction renders a watermarked PDF and consumes one confidential grant", async () => {
	let extractionRecord: any = null;
	let consumed = false;
	const document = {
		...documentFixture("confidential"),
		revision: 7,
		getCurrentVersion: () => ({
			contentDelta: { ops: [{ insert: "Confidential body text" }] },
			getState: () => "active",
		}),
	};
	const useCase = new RenderDocumentExtractionUseCase(
		{ generate: () => "EXTRACT-1" },
		{
			findDocumentById: async () => document,
			lockRevision: async () => true,
			incrementRevision: async () => 8,
		} as any,
		{
			consumeActiveExport: async () => {
				consumed = true;
				return { id: "GRANT-1" };
			},
			listByDocument: async () => [],
		} as any,
		{ record: async (record: unknown) => { extractionRecord = record; } },
		{
			authorize: async () => ({
				decision: {
					allowed: true,
					...policyReference,
					reasonCode: "confidential_export_granted",
					obligations: ["identity_timestamp_watermark"],
				},
				context,
			}),
		} as any,
		{ execute: async (operation: any) => operation({ client: {} }) },
	);

	const result = await useCase.execute("DOC-1", "STAFF-1", "export", 7);
	assert.equal(result.artifact.subarray(0, 8).toString(), "%PDF-1.4");
	assert.match(result.artifact.toString("latin1"), /NexusFons confidential/);
	assert.equal(result.documentRevision, 8);
	assert.equal(consumed, true);
	assert.equal(extractionRecord.grantId, "GRANT-1");
});

test("expired confidential extraction grants return a stable error code", async () => {
	const document = {
		...documentFixture("confidential"),
		revision: 3,
		getCurrentVersion: () => ({ contentDelta: null, getState: () => "active" }),
	};
	const useCase = new RenderDocumentExtractionUseCase(
		{ generate: () => "EXTRACT-2" },
		{ findDocumentById: async () => document } as any,
		{
			listByDocument: async () => [{ granteeStaffId: "STAFF-1", grantType: "export", status: "expired" }],
		} as any,
		{ record: async () => undefined },
		{ authorize: async () => { throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, { message: "denied" }); } } as any,
		{ execute: async (operation: any) => operation({ client: {} }) },
	);

	await assert.rejects(
		useCase.execute("DOC-1", "STAFF-1", "export", 3),
		(error: any) => error.errorCode === "governance_grant_expired",
	);
});
