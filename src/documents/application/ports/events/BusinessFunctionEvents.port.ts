interface BusinessFunctionEventsPort {
	businessFunctionCreated(payload: {
		businessFunction: {
            id: string;
            name: string;
        };
        actorId: string;
	}): Promise<void>;
}

export type { BusinessFunctionEventsPort };
