import type { StaffDetailsBasePayload } from "../../../../i & a/identity/domain/type/staffDetailsBasePayload.type.js";

interface OrchestrationIdentityPort {
	getStaffFromUid(uid: string): Promise<StaffDetailsBasePayload | null>;
}

export type { 
    OrchestrationIdentityPort, 
    StaffDetailsBasePayload as Staff,
};

