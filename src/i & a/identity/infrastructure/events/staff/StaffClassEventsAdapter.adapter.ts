import { GlobalEventTypes } from "../../../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../../../shared/application/port/services/eventbus.port.js";
import type { StaffClassificationEventsPort } from "../../../application/ports/events/staff/StaffclassificationEvents.port.js";

class StaffClassEventsAdapter implements StaffClassificationEventsPort {
	constructor(private readonly eventBus: EventBusPort) {}

    async staffClassificationCreated(payload: { classificationId: string; }): Promise<void> {
        await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.staff.STAFF_CLASSIFICATION_CREATED,
			occurredAt: new Date(),
			payload
		});
    }

    async staffClassificationMetadataUpdated(payload: { classificationId: string; }): Promise<void> {
        await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.staff.STAFF_CLASSIFICATION_METADATA_MODIFIED,
			occurredAt: new Date(),
			payload
		});
    }

}

export default StaffClassEventsAdapter;