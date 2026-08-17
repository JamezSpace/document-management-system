interface DocumentDispatchedNotificationPayload {
	document: {
		id: string;
		type: string;
		title: string;
	};
	sender: {
		id: string;
		name: string;
		officeName: string;
	};
	recipients: string[];
}

export type { DocumentDispatchedNotificationPayload };
