import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import type { CorrespondenceSubjectEventsPort } from "../../application/ports/events/CorrespondenceSubjectEvents.port.js";

class CorrespondenceSubjectEventsAdapter implements CorrespondenceSubjectEventsPort {
    constructor(private readonly eventBus: EventBusPort) {}

    async correspondenceSubjectCreated(payload: { correspondenceSubjectId: string; }): Promise<void> {
        await this.eventBus.emit({
			eventName: GlobalEventTypes.document.correspondence_subject.CORR_SUBJECT_CREATED,
			occurredAt: new Date(),
			payload,
		});
    }
}

export default CorrespondenceSubjectEventsAdapter;