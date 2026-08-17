interface BusinessFunctionPayload {
	id: string;
    subjectId: string;
	code: string;
	name: string;
	description?: string | null;
	createdAt?: Date;
	updatedAt?: Date | null;
}

class BusinessFunction {
	private readonly id: string;
    readonly subjectId: string;
	readonly code: string;
	readonly name: string;
	readonly description: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date | null;

	constructor(payload: BusinessFunctionPayload) {
		this.id = payload.id;
        this.subjectId = payload.subjectId;
		this.code = payload.code;
		this.name = payload.name;
		this.description = payload.description ?? null;
		this.createdAt = payload.createdAt ?? new Date();
		this.updatedAt = payload.updatedAt ?? null;
	}

	getBusinessFunctionId(): string {
		return this.id;
	}
}

export default BusinessFunction;
