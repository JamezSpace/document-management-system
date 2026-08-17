interface StaffClassificationPayload {
    id: string;
    staffId: string;
    capabilityClass: string;
    authorityLevel: number;
    effectiveFrom: Date;
    effectiveTo?: Date | null;
    createdAt?: Date;
    updatedAt?: Date | undefined;
}

class StaffClassification {
    readonly id: string;
    readonly staffId: string;
    readonly capabilityClass: string;
    readonly authorityLevel: number;
    readonly effectiveFrom: Date;
    readonly effectiveTo: Date | null;
    readonly createdAt: Date;
    readonly updatedAt?: Date | undefined;

    constructor(payload: StaffClassificationPayload) {

        if (payload.effectiveTo && payload.effectiveTo < payload.effectiveFrom) {
            throw new Error("effectiveTo cannot be earlier than effectiveFrom");
        }

        this.id = payload.id;
        this.staffId = payload.staffId;
        this.capabilityClass = payload.capabilityClass;
        this.authorityLevel = payload.authorityLevel;
        this.effectiveFrom = payload.effectiveFrom;
        this.effectiveTo = payload.effectiveTo ?? null;
        this.createdAt = payload.createdAt ?? new Date();
        this.updatedAt = payload.updatedAt;
    }

    isActive(onDate: Date = new Date()): boolean {
        if (onDate < this.effectiveFrom) return false;

        if (this.effectiveTo && onDate > this.effectiveTo) return false;

        return true;
    }

    isClosed(): boolean {
        return this.effectiveTo !== null;
    }

    close(effectiveTo: Date): StaffClassification {
        if (this.isClosed()) {
            throw new Error("Classification already closed");
        }

        if (effectiveTo < this.effectiveFrom) {
            throw new Error("Closing date cannot be before effectiveFrom");
        }

        return new StaffClassification({
            ...this,
            effectiveTo,
            updatedAt: new Date(),
        });
    }
}

export default StaffClassification;