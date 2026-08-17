interface MediaEventsPort {
	mediaAdded(payload: {
		mediaId: string;
		uploadedBy: string;
	}): Promise<void>;

	mediaReplaced(payload: {
		oldMediaId: string;
		newMediaId: string;
		replacedBy: string;
	}): Promise<void>;
}

export type { MediaEventsPort };
