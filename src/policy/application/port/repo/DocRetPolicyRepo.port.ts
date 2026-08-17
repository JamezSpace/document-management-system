import type DocumentRetentionPolicy from "../../../domain/DocumentRetentionPolicy.js";

interface  DocumentRetentionPolicyRepositoryPort {
    save(documentRetentionPolicy: DocumentRetentionPolicy): Promise<DocumentRetentionPolicy>;
}

export type {DocumentRetentionPolicyRepositoryPort}