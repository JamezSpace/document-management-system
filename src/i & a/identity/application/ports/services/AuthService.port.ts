interface AuthServicePort {
	verifyIdToken(token: string): Promise<string>;

	createUser(email: string): Promise<{ authProviderId: string }>;
    
	generatePasswordSetupLink(email: string, details: {staffId: string, inviteId: string}): Promise<string>;
}

export type { AuthServicePort };
