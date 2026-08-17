import Document from "../../../../documents/domain/entities/document/Document.js";
import { LifecycleState } from "../../../../documents/domain/enum/lifecycleState.enum.js";
import type { TransactionContext } from "../../../infrastructure/persistence/primary/postgres.js";

class DispatchDocument extends Document {
	isDispatchable() {
		const currentVersion = this.getCurrentVersion();

		if (!currentVersion) return false;

		// in_review state for external docs and active state for internal docs
		return (
			currentVersion.getState() === LifecycleState.IN_REVIEW ||
			currentVersion.getState() === LifecycleState.ACTIVE
		);
	}
}

interface DispatchDocumentPort {
	getDocumentById(
		documentId: string,
		tx?: TransactionContext,
	): Promise<DispatchDocument | null>;

	getDocAddresseesByDocIdMultiple(
		documentId: string,
		tx?: TransactionContext,
	): Promise<
		{
			unitId: string;
			designationId: string;
		}[]
	>;

	getDocAddresseeByDocIdSingle(
		documentId: string,
		tx?: TransactionContext,
	): Promise<{
		unitId: string;
		designationId: string;
	}>;
}

export type { DispatchDocumentPort };
