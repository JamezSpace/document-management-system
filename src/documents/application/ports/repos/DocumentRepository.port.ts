import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Document from "../../../domain/entities/document/Document.js";

interface DocumentRepositoryPort {
    save(document: Document, tx?: TransactionContext): Promise<Document>;

    fetchDocumentsByStaff(staffId: string): Promise<Document[]>;

    discover(searchTerm: string, limit: number): Promise<Document[]>;

    findDocumentById(id: string): Promise<Document | null>;

    editDocument(document: Document, tx?: TransactionContext): Promise<Document | null>;

    softDeleteDocument(id: string): Promise<void>;

    hardDeleteDocument(id: string): Promise<void>;
}

export type { DocumentRepositoryPort };

