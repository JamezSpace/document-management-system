interface DocumentTypeEventsPort {
    documentTypeCreated(payload: {
        docType: {
            id: string;
            name: string;
        };
        actorId: string;
    }): Promise<void>;
}

export type { DocumentTypeEventsPort }