import type { OrchestrationDocumentPort } from "../../../../shared/application/port/intersubsystem/OrchestrationDocument.port.js";

class GetDocumentUsecase {
    constructor(
        private readonly orchestrationDocumentPort: OrchestrationDocumentPort
    ){}

    async execute(documentId: string) {
        const document = await this.orchestrationDocumentPort.getDocument(documentId);

        return document;
    }
}

export default GetDocumentUsecase;