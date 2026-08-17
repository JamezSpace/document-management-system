interface OrgUnitEventsPort {
    unitCreated(payload: {
        unitId: string;
    }): Promise<void>
}

export type {OrgUnitEventsPort};