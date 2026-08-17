interface DesignationPayload {
	id: string;
	title: string;
	description?: string;
	officeId: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export type { DesignationPayload };
