import type { EventType } from "../../enum/event.enum.js";

interface EventDetails {
	eventName: EventType;
	occurredAt: Date;
	payload: any;
}

interface EventBusPort {
	emit(event: EventDetails): Promise<void>;
	subscribe(
		eventName: EventType,
		handler: (event: EventDetails) => Promise<void>,
	): void;
}

export type { EventBusPort, EventDetails };

