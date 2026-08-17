import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import type { DocumentDispatchedNotificationPayload } from "../../../shared/application/types/dispatchNotification/dispatchNotification.type.js";
import type { DispatchRecordEvents } from "../../application/port/events/DispatchRecordEvents.port.js";

class DispatchEventsAdapter implements DispatchRecordEvents {
	constructor(private readonly eventBus: EventBusPort) {}
	
    async documentDispatched(payload: {
		document: { id: string; type: string; title: string };
		sender: { id: string; name: string; officeName: string };
		recipients: string[];
	}): Promise<void> {
		this.eventBus.emit({
			eventName: GlobalEventTypes.dispatch.DOC_DISPATCHED,
			occurredAt: new Date(),
			payload: payload as DocumentDispatchedNotificationPayload,
		});
	}
}

export default DispatchEventsAdapter;
