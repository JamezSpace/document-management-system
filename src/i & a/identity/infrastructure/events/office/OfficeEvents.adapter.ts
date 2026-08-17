import { GlobalEventTypes } from "../../../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../../../shared/application/port/services/eventbus.port.js";
import type { OfficeEventsPort } from "../../../application/ports/events/office/OfficeEvents.port.js";

class OfficeEventsAdapter implements OfficeEventsPort {
    constructor(private readonly eventBus: EventBusPort) {
        }

    async officeCreated(payload: { officeId: string; }): Promise<void> {
         await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.office.OFFICE_CREATED,
            occurredAt: new Date(),
            payload: {
                officeId: payload.officeId,
            },
        });
    }

    async officeUpdated(payload: { officeId: string; }): Promise<void> {
         await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.office.OFFICE_UPDATED,
            occurredAt: new Date(),
            payload: {
                officeId: payload.officeId,
            },
        });
    }
}

export default OfficeEventsAdapter;