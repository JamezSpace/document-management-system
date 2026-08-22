import type { GovernanceDocumentSensitivity } from "./DocumentGovernancePolicy.port.js";
import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

const DocumentLifecycleState = {
	DRAFT: "draft",
	IN_REVIEW: "in_review",
	ACTIVE: "active",
	DECLARED_RECORD: "declared_record",
} as const;

const DocumentCorrespondenceDirection = {
	INTERNAL: "internal",
	EXTERNAL: "external",
} as const;

interface OrchestrationDocumentVersion {
	id: string;
	contentDelta: unknown;
	getState(): string;
}

interface Document {
	id: string;
	ownerId: string;
	title: string;
	referenceNumber: string | null;
	revision: number;
	addressees: Array<{
		recipientUnitId: string;
		addressedToDesignationId: string;
		isPrimary: boolean;
	}>;
	classification: {
		sensitivity: GovernanceDocumentSensitivity;
		governancePolicyKey?: string | null;
		governancePolicyVersion?: number | null;
	};
	correspondence: { direction: string };
	retention: unknown;
	createdAt: Date;
	getCurrentVersion(): OrchestrationDocumentVersion | null;
}

interface OrchestrationDocumentPort {
    getDocument(
		documentId: string,
		tx?: TransactionContext,
	): Promise<Document | null>;
}

export type { OrchestrationDocumentPort, Document };
export { DocumentLifecycleState, DocumentCorrespondenceDirection };
