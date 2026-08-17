interface DesignationCapabilityClassMapPayload {
    designationId: string;
    capabilityClassId: string;
}

class DesignationCapabilityClassMap {
    designationId: string;
    capabilityClassId: string;

    constructor(payload: DesignationCapabilityClassMapPayload) {
        this.designationId = payload.designationId
        this.capabilityClassId = payload.capabilityClassId
    }
}

export default DesignationCapabilityClassMap;