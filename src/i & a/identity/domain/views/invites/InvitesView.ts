import type { EmploymentType, InviteStatus } from "../../enum/staff.enum.js";

interface InvitesView {
	readonly id: string;
	readonly email: string;
	readonly invited_by: {
		id: string;
		staffNumber: number;
        fullName: string;
		unit: {
			id: string;
			name: string;
			sector: string;
		};
		office: {
			id: string;
			name: string;
		};
		designation: {
			id: string;
			title: string;
		};
	};
	readonly unit: {
		id: string;
		name: string;
		sector: string;
	};
	readonly office: {
		id: string;
		name: string;
	};
	readonly designation: {
		id: string;
		title: string;
	};
	readonly employmentType: EmploymentType;
	readonly token: string;
	readonly isUsed: boolean;
	readonly expiresAt: Date;
	readonly acceptedAt: Date | null;
	readonly rejectedAt: Date | null;
	readonly status: InviteStatus;
	readonly createdAt: Date;
	readonly updatedAt?: Date | null;
}

export type { InvitesView };
