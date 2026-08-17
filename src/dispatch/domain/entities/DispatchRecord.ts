import type { DispatchStatus } from "../enum/dispatchStatus.enum.js";
import type { DispatchType } from "../enum/dispatchType.enum.js";

interface DispatchRecordPayload {
	id: string;
	documentId: string;

	senderStaffId: string;
    senderDesignationId: string | null;
	senderUnitId: string;

	recipientDesignationId: string | null;
	recipientUnitId: string;

    dispatchType: DispatchType
	status: DispatchStatus;
    
	dispatchedAt: Date;

    parentDispatchId: string | null;
}

class DispatchRecord {
	id: string;
	documentId: string;

	senderStaffId: string;
	senderDesignationId: string | null;
	senderUnitId: string;

	recipientDesignationId: string | null;
	recipientUnitId: string;

    dispatchType: DispatchType
	status: DispatchStatus;
    
	dispatchedAt: Date;

    parentDispatchId: string | null;


	constructor(payload: DispatchRecordPayload) {
		this.id = payload.id;
		this.documentId = payload.documentId;

		this.senderStaffId = payload.senderStaffId;
		this.senderDesignationId = payload.senderDesignationId;
		this.senderUnitId = payload.senderUnitId;
		
        this.recipientDesignationId = payload.recipientDesignationId;
        this.recipientUnitId = payload.recipientUnitId;

        this.dispatchType = payload.dispatchType;
		this.status = payload.status;

		this.dispatchedAt = new Date(payload.dispatchedAt);

        this.parentDispatchId = payload.parentDispatchId ?? null
	}
}

export default DispatchRecord;
