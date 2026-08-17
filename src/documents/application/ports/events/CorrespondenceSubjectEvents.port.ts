interface CorrespondenceSubjectEventsPort {
	correspondenceSubjectCreated(payload: {
		correspondenceSubjectId: string;
	}): Promise<void>;
}

export type { CorrespondenceSubjectEventsPort };
