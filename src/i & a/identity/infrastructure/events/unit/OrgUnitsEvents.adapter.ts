import { GlobalEventTypes } from "../../../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../../../shared/application/port/services/eventbus.port.js";
import type { OrgUnitEventsPort } from "../../../application/ports/events/unit/OrgUnitEvents.port.js";

class OrgUnitsEventsAdapter implements OrgUnitEventsPort {
    constructor(private readonly eventBus: EventBusPort) {
        }
        
    async unitCreated(payload: { unitId: string; }): Promise<void> {
         await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.org_unit.ORG_UNIT_CREATED,
            occurredAt: new Date(),
            payload: {
                unitId: payload.unitId,
            },
        });
    }
}

export default OrgUnitsEventsAdapter;