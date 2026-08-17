/**
 * These wraps all events that would get triggered in the identity & authority subsystem specifically the office designation domain
 */
interface DesignationEventsPort {
	officeDesignationCreated(payload: {
        designationId: string;
    }): Promise<void>;

	officeDesignationUpdated(payload: {
        designationId: string;
    }): Promise<void>;
}

export type { DesignationEventsPort };
