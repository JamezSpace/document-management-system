import type { TransactionContext } from "../../../../shared/infrastructure/persistence/primary/postgres.js";
import DocumentType from "../../../domain/entities/documentType/DocumentType.js";

interface DocumentTypeRepositoryPort {
    save(type: DocumentType): Promise<DocumentType>;

    fetchAll(): Promise<DocumentType[]>;

    findDocumentTypeById(typeId: string, tx?: TransactionContext): Promise<DocumentType | null>
}

export type {DocumentTypeRepositoryPort};