import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import type DocumentVersion from "../../../domain/entities/document/DocumentVersion.js";

interface DocumentVersionRepositoryPort {
    save(document: DocumentVersion, tx?: TransactionContext): Promise<DocumentVersion>;

    findVersionedDocumentById(id: string): Promise<DocumentVersion | null>;

    editVersionedDocument(document: DocumentVersion, tx?: TransactionContext): Promise<DocumentVersion | null>;

    softDeleteDocument(id: string): Promise<void>;

    hardDeleteDocument(id: string): Promise<void>;
}

export type { DocumentVersionRepositoryPort };
