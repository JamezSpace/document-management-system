import { LifecycleState } from "../../../documents/domain/enum/lifecycleState.enum.js";

interface DispatchStarterPort {
    // payload must tally with DocumentSubmitted event
	startDispatch(payload:  {
		documentId: string;
		activatedBy: string;
	}): Promise<void>;
}

export type { DispatchStarterPort };