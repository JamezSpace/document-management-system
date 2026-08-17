interface CapabilityRoleMapPayload {
	capabilityClassId: string;
	roleId: string;
}

class CapabilityRoleMap {
	capabilityClassId: string;
	roleId: string;

	constructor(payload: CapabilityRoleMapPayload) {
		this.capabilityClassId = payload.capabilityClassId;
		this.roleId = payload.roleId;
	}
}

export default CapabilityRoleMap;
