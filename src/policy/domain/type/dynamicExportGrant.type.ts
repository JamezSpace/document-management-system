interface DynamicExportGrant {
	active: boolean;
	grantedBy: "originator" | "unit_head";
	expiresAt?: Date | null;
	remainingUses?: number | null;
}

export type { DynamicExportGrant };
