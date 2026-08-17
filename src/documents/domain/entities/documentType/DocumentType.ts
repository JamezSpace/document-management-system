interface DocumentTypePayload {
	id: string;
	code: string;
	name: string;
	createdAt?: Date;
	updatedAt?: Date | null;
}


class DocumentType {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly createdAt: Date;
    readonly updatedAt: Date | null;

    constructor(payload: DocumentTypePayload){
        this.id = payload.id;
        this.code = payload.code;
        this.name = payload.name;
        this.createdAt = payload.createdAt ?? new Date()
        this.updatedAt = payload.updatedAt ?? null
    }
}

export default DocumentType;