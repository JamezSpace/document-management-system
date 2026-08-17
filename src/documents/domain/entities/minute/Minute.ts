import { MinuteAction } from "../../enum/MinuteAction.enum.js";

interface MinutePayload {
	id: string;
	documentId: string;
	authorStaffId: string;
	action: MinuteAction;
	content?: string | null;
	inboxEntryId?: string | null;
	parentMinuteId?: string | null;
	createdAt?: Date;
}

class Minute {
	readonly id: string;
	readonly documentId: string;
	readonly authorStaffId: string;
	readonly inboxEntryId: string | null;
	readonly parentMinuteId: string | null;
	readonly action: MinuteAction;
	readonly content: string | null;
	readonly createdAt: Date;

	constructor(payload: MinutePayload) {
		this.id = payload.id;
		this.documentId = payload.documentId;
		this.authorStaffId = payload.authorStaffId;
		this.inboxEntryId = payload.inboxEntryId ?? null;
		this.parentMinuteId = payload.parentMinuteId ?? null;
		this.action = payload.action;
		this.content =
	payload.content == null || payload.content.trim().length === 0
		? null
		: payload.content;
		this.createdAt = payload.createdAt ?? new Date();        
	}
}

export default Minute;
export type { MinutePayload };
