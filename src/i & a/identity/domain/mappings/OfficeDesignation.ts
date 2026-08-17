interface OfficeDesignationPayload {
    id: string;
    officeId: string;
    designationId: string;
    hierarchyLevel: number;
    createdAt: Date;
    updatedAt?: Date;
}

class OfficeDesignation {
    id: string;
    officeId: string;
    designationId: string;
    hierarchyLevel: number;
    createdAt: Date;
    updatedAt: Date | null;

    constructor(payload: OfficeDesignationPayload) {
        this.id = payload.id;
        this.officeId = payload.officeId;
        this.designationId = payload.designationId;
        this.hierarchyLevel = payload.hierarchyLevel;
        this.createdAt = payload.createdAt ?? new Date();
        this.updatedAt = payload.updatedAt ?? null;
    }
}

export default OfficeDesignation;