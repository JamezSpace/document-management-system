/**
 * These wraps all events that would get triggered in the identity & authority subsystem specifically the office domain
 */
interface OfficeEventsPort {
	officeCreated(payload: {
        officeId: string;
    }): Promise<void>;

	officeUpdated(payload: {
        officeId: string;
    }): Promise<void>;
}

export type { OfficeEventsPort };
