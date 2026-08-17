import { GlobalEventTypes } from "../../shared/application/enum/event.enum.js";
import type { DispatchStarterPort } from "../../shared/application/port/DispatchStarter.port.js";
import type { EventBusPort } from "../../shared/application/port/services/eventbus.port.js";

export default function registerAllDispatchSubscribers(
	eventBus: EventBusPort,
	dispatchStarter: DispatchStarterPort
) {
	eventBus.subscribe(
		GlobalEventTypes.document.document.DOCUMENT_ACTIVATED,
		async (event) => {
			await dispatchStarter.startDispatch(event.payload);
		}
	);
}