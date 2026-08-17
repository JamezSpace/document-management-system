interface DocumentEventsPort {
	documentInitialized(payload: {
		documentId: string;
		createdBy: string;
	}): Promise<void>;

	documentVersionCreated(payload: {
		documentId: string;
		versionedBy: string;
	}): Promise<void>;

	documentVersionChanged(payload: {
		documentId: string;
		actorBy: string;
	}): Promise<void>;

	documentSubmitted(payload: {
		documentId: string;
		lifecycleState: string;
		submittedBy: string;
	}): Promise<void>;

	documentCancelled(payload: {
		documentId: string;
		cancelledBy: string;
		reason: string;
	}): Promise<void>;

	documentActivated(payload: {
		documentId: string;
		activatedBy: string;
	}): Promise<void>;

	documentDeclared(payload: {
		documentId: string;
		declaredBy: string;
	}): Promise<void>;

	documentArchived(payload: {
		documentId: string;
		archivedBy: string;
	}): Promise<void>;

	documentDeleted(payload: {
		documentId: string;
		deletedBy: string;
	}): Promise<void>;

	documentDisposed(payload: {
		documentId: string;
		disposedBy: string;
	}): Promise<void>;

	documentMediaAttached(payload: {
		documentId: string;
		mediaId: string;
		attachedBy: string;
	}): Promise<void>;

	documentMediaReplaced(payload: {
		documentId: string;
		oldMediaId: string;
		newMediaId: string;
		replacedBy: string;
	}): Promise<void>;
}

export type { DocumentEventsPort };
