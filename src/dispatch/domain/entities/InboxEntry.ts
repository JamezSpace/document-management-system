import { InboxEntryStatus } from "../enum/inboxEntryStatus.enum.js";

interface InboxEntryPayload {
	id: string;
	dispatchId: string;
	documentId: string;
	staffId: string;
	designationId: string;
	unitId: string;
	status: InboxEntryStatus;
	receivedAt: Date;
	readAt?: Date | null;
	acknowledgedAt?: Date | null;
}

function normalizeInboxEntryStatus(
	status: InboxEntryStatus | string,
): InboxEntryStatus {
	const normalized = status.toLowerCase();

	switch (normalized) {
		case InboxEntryStatus.UNREAD:
			return InboxEntryStatus.UNREAD;
		case InboxEntryStatus.READ:
			return InboxEntryStatus.READ;
		case InboxEntryStatus.ACKNOWLEDGED:
			return InboxEntryStatus.ACKNOWLEDGED;
		default:
			return InboxEntryStatus.UNREAD;
	}
}

class InboxEntry {
	readonly id: string;
	readonly dispatchId: string;
	readonly documentId: string;
	readonly staffId: string;
	readonly designationId: string;
	readonly unitId: string;
	status: InboxEntryStatus;
	readonly receivedAt: Date;
	readAt: Date | null;
	acknowledgedAt: Date | null;

	constructor(payload: InboxEntryPayload) {
		this.id = payload.id;
		this.dispatchId = payload.dispatchId;
		this.documentId = payload.documentId;
		this.staffId = payload.staffId;
		this.designationId = payload.designationId;
		this.unitId = payload.unitId;
		this.status = payload.status;
		this.receivedAt = new Date(payload.receivedAt);
		this.readAt = payload.readAt ? new Date(payload.readAt) : null;
		this.acknowledgedAt = payload.acknowledgedAt
			? new Date(payload.acknowledgedAt)
			: null;
	}
}

export default InboxEntry;
export type { InboxEntryPayload };
