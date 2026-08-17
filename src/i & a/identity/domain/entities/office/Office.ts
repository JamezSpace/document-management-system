interface OfficePayload {
    id: string;
    name: string;
    unitId: string;
    createdAt?: Date;
    updatedAt?: Date;
}


class Office {
    private readonly id: string;
    readonly name: string;
    readonly unitId: string;
    readonly createdAt: Date;
    readonly updatedAt?: Date | undefined;

    constructor(payload: OfficePayload) {
        this.id = payload.id;
        this.name = payload.name;
        this.unitId = payload.unitId;

        this.createdAt = payload.createdAt ?? new Date();
        this.updatedAt = payload.updatedAt;
    }

    getOfficeId() {
        return this.id;
    }
}

export default Office;