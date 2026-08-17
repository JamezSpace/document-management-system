interface RoleEventsPort {
	roleCreated(payload: {
        roleId: string;
    }): Promise<void>;
}

export type { RoleEventsPort };
