import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import type { MediaEventsPort } from "../../application/port/events/MediaEvents.port.js";

class MediaEventsAdapter implements MediaEventsPort {
	constructor(private readonly eventBus: EventBusPort) {}

	async mediaAdded(payload: {
		mediaId: string;
		uploadedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.media.MEDIA_ADDED,
			occurredAt: new Date(),
			payload,
		});
	}

	async mediaReplaced(payload: {
		oldMediaId: string;
		newMediaId: string;
		replacedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.media.MEDIA_REPLACED,
			occurredAt: new Date(),
			payload,
		});
	}
}

export default MediaEventsAdapter;
