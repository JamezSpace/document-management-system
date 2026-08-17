import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

interface DocumentView {
	docId: string;
	owner: {
		id: string;
		unitId: string | null;
		officeId: string | null;
		designationId: string | null;
	};
}

interface WorkflowDocumentPort {
	getDocumentById(
		documentId: string,
		tx?: TransactionContext,
	): Promise<DocumentView>;
}

export type { DocumentView, WorkflowDocumentPort };

