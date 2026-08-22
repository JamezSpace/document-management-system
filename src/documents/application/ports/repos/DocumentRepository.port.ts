import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Document from "../../../domain/entities/document/Document.js";

interface DocumentRepositoryPort {
    save(document: Document, tx?: TransactionContext): Promise<Document>;

    fetchDocumentsByStaff(staffId: string): Promise<Document[]>;

    discover(searchTerm: string, limit: number, cursor?: { createdAt: Date; id: string } | null): Promise<Document[]>;

    findDocumentById(id: string): Promise<Document | null>;

    editDocument(document: Document, expectedRevision: number, tx?: TransactionContext): Promise<Document | null>;

	incrementRevision(id: string, expectedRevision: number, tx?: TransactionContext): Promise<number | null>;
	lockRevision(id: string, expectedRevision: number, tx: TransactionContext): Promise<boolean>;

    softDeleteDocument(id: string): Promise<void>;

    hardDeleteDocument(id: string, expectedRevision: number): Promise<boolean>;
}

export type { DocumentRepositoryPort };

