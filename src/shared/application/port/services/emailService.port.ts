interface GlobalEmailServicePort {
	sendTo(
		payload: { recipientEmail: string; message: string },
		type: "onboarding" | "notification",
	): Promise<boolean>;
}

export type { GlobalEmailServicePort };
