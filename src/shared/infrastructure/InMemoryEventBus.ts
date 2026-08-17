import type { EventBusPort, EventDetails } from "../application/port/services/eventbus.port.js";

class InMemoryEventBusAdapter implements EventBusPort {
	private handlers: Map<string, Function[]> = new Map();

	async emit(event: EventDetails): Promise<void> {
		const eventHandlers = this.handlers.get(event.eventName) || [];
		console.log(`[Event Published]: ${event.eventName}`, event.payload);

		// In a simple in-memory version, we just execute listeners immediately
		eventHandlers.forEach((handler) => handler(event));
	}

	async publishAll(events: EventDetails[]): Promise<void> {
		await Promise.all(events.map((ev) => this.emit(ev)));
	}

	// Used by other subsystems to "Subscribe" during setup
	subscribe(eventName: string, handler: Function): void {
		const current = this.handlers.get(eventName) || [];
		this.handlers.set(eventName, [...current, handler]);
	}
}

export default InMemoryEventBusAdapter;