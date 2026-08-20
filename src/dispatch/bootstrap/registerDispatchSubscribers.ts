import { GlobalEventTypes } from "../../shared/application/enum/event.enum.js";
import type { DispatchStarterPort } from "../../shared/application/port/DispatchStarter.port.js";
import type { EventBusPort } from "../../shared/application/port/services/eventbus.port.js";
import type HandoverTransferredStaffCustodyUseCase from "../application/usecases/HandoverTransferredStaffCustody.usecase.js";

export default function registerAllDispatchSubscribers(
	eventBus: EventBusPort,
	dispatchStarter: DispatchStarterPort,
	handoverTransferredStaffCustody: HandoverTransferredStaffCustodyUseCase,
) {
	eventBus.subscribe(
		GlobalEventTypes.document.document.DOCUMENT_ACTIVATED,
		async (event) => {
			await dispatchStarter.startDispatch(event.payload);
		}
	);
	eventBus.subscribe(
		GlobalEventTypes.identity_authority.identity.staff.STAFF_POSITION_CHANGED,
		async (event) => {
			await handoverTransferredStaffCustody.execute(event.payload.staffId);
			await handoverTransferredStaffCustody.claimForIncomingStaff(event.payload.staffId);
		},
	);
	eventBus.subscribe(
		GlobalEventTypes.identity_authority.identity.staff.STAFF_ACTIVATED,
		async (event) => {
			await handoverTransferredStaffCustody.claimForIncomingStaff(event.payload.staffId);
		},
	);
}
