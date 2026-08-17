import type { LifecycleActions } from "../enum/lifecycleActions.enum.js";
import type { LifecycleState } from "../enum/lifecycleState.enum.js";

interface LifecycleHistoryPayload {
	id: string;
	documentId: string;
	documentVersionId?: string;
	fromState: LifecycleState | null;
	toState: LifecycleState;
	action: LifecycleActions;
	actorId: string;
	metadata?: Record<string, unknown>;
}

class LifecycleHistory {
    id: string;
    documentId: string;
    documentVersionId: string | null;
    fromState: LifecycleState | null;
    toState: LifecycleState;
    action: LifecycleActions;
    actorId: string;
    metadata: Record<string, unknown> | null;

    constructor(
        payload: LifecycleHistoryPayload
    ) {
        this.id = payload.id;
        this.documentId = payload.documentId;
        this.documentVersionId = payload.documentVersionId ?? null;
        this.fromState = payload.fromState;
        this.toState = payload.toState;
        this.action = payload.action;
        this.actorId = payload.actorId;
        this.metadata = payload.metadata ?? null;
    }
}

export default LifecycleHistory;
