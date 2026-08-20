import { strict as assert } from "node:assert";
import { test } from "node:test";

import DocumentGovernanceGuard from "../../src/documents/application/services/DocumentGovernanceGuard.service.js";
import ManageDocumentAttachmentUseCase from "../../src/documents/application/usecases/document/ManageDocumentAttachment.usecase.js";
import DocumentCanvasProjector from "../../src/orchestration/workspace/application/services/DocumentCanvasProjector.js";
import type { DocumentGovernancePolicyPort } from "../../src/shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import DocumentGovernanceObligationExecutor from "../../src/documents/application/services/DocumentGovernanceObligationExecutor.service.js";
import DiscoverDocumentsUseCase from "../../src/documents/application/usecases/document/DiscoverDocuments.usecase.js";

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
		useCase.attach({ documentId: "DOC-1", mediaId: "MEDIA-1", actorStaffId: "STAFF-1" }),
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
		useCase.attach({ documentId: "DOC-1", mediaId: "MEDIA-1", actorStaffId: "STAFF-1" }),
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
		{ findDocumentById: async () => documentFixture("public") } as any,
		{
			mediaExistsForUploader: async () => true,
			save: async (payload: unknown) => { savedPayload = payload; },
			listByDocument: async () => [],
			remove: async () => false,
		} as any,
		governance,
		{ execute: async (operation: any) => operation({ client: {} }) } as any,
	);

	await useCase.attach({ documentId: "DOC-1", mediaId: "MEDIA-1", actorStaffId: "STAFF-1" });
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
	assert.deepEqual(result.map((item) => item.id), ["DOC-1"]);
	assert.deepEqual(auditEvents, [{ outcome: "denied", documentId: "DOC-2" }]);
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
