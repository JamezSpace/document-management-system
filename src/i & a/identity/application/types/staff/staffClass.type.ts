interface StaffClassTypeForCreation {
	staffId: string;
	capabilityClass: string;
    authorityLevel: number;
    effectiveFrom: Date;
    effectiveTo: Date;
    createdAt?: Date;
	updatedAt?: Date;
}

export type { StaffClassTypeForCreation };
