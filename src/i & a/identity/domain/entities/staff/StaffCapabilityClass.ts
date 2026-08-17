import type { CapabilityClassCategory } from "../../enum/capabilityClassCategory.enum.js";

interface StaffCapabilityClassPayload {
	id: string;
	name: string;
	category: CapabilityClassCategory;
	description?: string;
	createdAt?: Date;
}

class StaffCapabilityClass {
	private readonly id: string;
	readonly name: string;
	readonly category: CapabilityClassCategory;
	readonly description: string | null;
	readonly createdAt: Date;

	constructor(payload: StaffCapabilityClassPayload) {
		this.id = payload.id;
		this.name = payload.name;
		this.category = payload.category;
		this.description = payload?.description ?? null;
		this.createdAt = payload.createdAt ?? new Date();
	}

	getStaffCapabilityClassId() {
		return this.id;
	}
}

export default StaffCapabilityClass;
