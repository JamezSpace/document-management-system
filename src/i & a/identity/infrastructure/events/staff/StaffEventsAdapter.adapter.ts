import { GlobalEventTypes } from "../../../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../../../shared/application/port/services/eventbus.port.js";
import type { StaffEventsPort } from "../../../application/ports/events/staff/StaffEvent.port.js";

class StaffEventsAdapter implements StaffEventsPort {
	constructor(private readonly eventBus: EventBusPort) {}

	async staffAdded(payload: { staffId: string }): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.staff.STAFF_ADDED,
			occurredAt: new Date(),
			payload
		});
	}
    
    async onboardingStaffEmailSent(payload: { staffId: string; }): Promise<void> {
        await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.staff.ONBOARDING_STAFF_EMAIL_SENT,
			occurredAt: new Date(),
			payload
		});
    }
    
    async staffActivated(payload: { staffId: string; }): Promise<void> {
        await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.staff.STAFF_ACTIVATED,
            occurredAt: new Date(),
            payload
        });
        
    }

    async staffUpdated(payload: { staffId: string }): Promise<void> {
        await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.staff.STAFF_UPDATED,
            occurredAt: new Date(),
            payload
        });
    }

    async staffMediaAssigned(payload: { staffId: string; mediaId: string; assignedBy: string; }): Promise<void> {
        await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.staff.STAFF_MEDIA_ASSIGNED,
			occurredAt: new Date(),
			payload
		});
    }
    
    async staffMediaReplaced(payload: { staffId: string; oldMediaId: string; newMediaId: string; replacedBy: string; }): Promise<void> {
        await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.staff.STAFF_MEDIA_REPLACED,
            occurredAt: new Date(),
            payload
        });
    }
}

export default StaffEventsAdapter;
