import type Document from "../../../../documents/domain/entities/document/Document.js";
import { CorrespondenceDirection } from "../../../../documents/domain/enum/correspondenceDirection.enum.js";
import { LifecycleState } from "../../../../documents/domain/enum/lifecycleState.enum.js";
import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

interface OrchestrationDocumentPort {
    getDocument(
		documentId: string,
		tx?: TransactionContext,
	): Promise<Document | null>;
}

export type {OrchestrationDocumentPort, Document};
export {
    LifecycleState as DocumentLifecycleState,
    CorrespondenceDirection as DocumentCorrespondenceDirection
};
