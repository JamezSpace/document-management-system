interface DocumentAddresseePayload {
	documentId: string;
	recipientUnitId: string;
	addressedToDesignationId: string;
	isPrimary: boolean;
}

class DocumentAddressee {
	documentId: string;
	recipientUnitId: string;
	addressedToDesignationId: string;
	isPrimary: boolean;

	constructor(payload: DocumentAddresseePayload) {
		this.documentId = payload.documentId;
		this.recipientUnitId = payload.recipientUnitId;
		this.addressedToDesignationId = payload.addressedToDesignationId;
		this.isPrimary = payload.isPrimary;
	}
}

export default DocumentAddressee;
export type { DocumentAddresseePayload };
