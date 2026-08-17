interface IdentityEmailServicePort {
	sendOnboardingLink(recipientEmail: string, message: string): Promise<void>;

	nudgeInvite(recipientEmail: string, message: string): Promise<boolean>;

    notifyInviteOfSuccessfulAccountActivation(recipientEmail: string, message: string): Promise<void>;
}

export type { IdentityEmailServicePort };
