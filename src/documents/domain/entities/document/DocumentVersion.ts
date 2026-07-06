import DocumentTransitions from "../../DocumentTransition.js";
import { CorrespondenceDirection } from "../../enum/correspondenceDirection.enum.js";
import { LifecycleState } from "../../enum/lifecycleState.enum.js";
import type { LifecycleMetadata } from "../../metadata/Lifecycle.metadata.js";

interface DocumentVersionPayload {
    id: string;
	documentId: string;
    contentDelta: unknown;
	versionNumber: number;
	mediaId?: string | null;
	createdAt: Date;
	createdBy: string;
	lifecycle: LifecycleMetadata;
}

class DocumentVersion {
	id: string;
    documentId: string;
    contentDelta: unknown;
	versionNumber: number;
	mediaId: string | null;
	createdAt: Date;
	createdBy: string;
	lifecycle: LifecycleMetadata;

	constructor(payload: DocumentVersionPayload) {
        this.id = payload.id;
		this.documentId = payload.documentId;
        this.contentDelta = payload.contentDelta;
		this.versionNumber = payload.versionNumber;
		this.mediaId = payload.mediaId ?? null;
		this.createdAt = payload.createdAt;
		this.createdBy = payload.createdBy;
		this.lifecycle = payload.lifecycle;
	}

	public getState(): LifecycleState {
		return this.lifecycle.currentState;
	}

	private transitionTo(newState: LifecycleState, actorId: string) {
		DocumentTransitions.transition(this.getState(), newState);

		this.lifecycle.currentState = newState;
		this.lifecycle.stateEnteredAt = new Date();
		this.lifecycle.stateEnteredBy = actorId;
	}

	submit(actorId: string, documentDirection: string) {
        // internal documents doesn't to be in_reveiw since its addressed to another staff
        if(documentDirection === CorrespondenceDirection.INTERNAL)
            this.transitionTo(LifecycleState.ACTIVE, actorId);
        else
            this.transitionTo(LifecycleState.IN_REVIEW, actorId);
	}

	declareRecord(actorId: string) {
        this.transitionTo(LifecycleState.DECLARED_RECORD, actorId);
    }

	archive(actorId: string) {
        this.transitionTo(LifecycleState.ARCHIVED, actorId);
    }

	dispose(actorId: string) {
        this.transitionTo(LifecycleState.DISPOSED, actorId);
    }
}

export default DocumentVersion;
