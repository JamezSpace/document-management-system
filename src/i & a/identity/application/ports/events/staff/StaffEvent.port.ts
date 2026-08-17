interface StaffEventsPort {
	staffAdded(payload: { staffId: string }): Promise<void>;

    onboardingStaffEmailSent(payload: { staffId: string }): Promise<void>;

    staffActivated(payload: {staffId: string}): Promise<void>;

	staffUpdated(payload: { staffId: string }): Promise<void>;

	staffMediaAssigned(payload: {
		staffId: string;
		mediaId: string;
		assignedBy: string;
	}): Promise<void>;

    staffMediaReplaced(payload: {
		staffId: string;
		oldMediaId: string;
		newMediaId: string;
		replacedBy: string;
	}): Promise<void>;
}

export type { StaffEventsPort };
