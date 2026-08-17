interface CorrespondenceSubjectPayload {
	id: string;
	code: string;
	name: string;
	description?: string | null;
	createdAt?: Date;
	uploadedAt?: Date | null;
}

class CorrespondenceSubject {
	private readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly description: string | null;
	readonly createdAt: Date;
	readonly uploadedAt: Date | null;

	constructor(payload: CorrespondenceSubjectPayload) {
		this.id = payload.id;
		this.code = payload.code;
		this.name = payload.name;
		this.description = payload.description ?? null;
		this.createdAt = payload.createdAt ?? new Date();
		this.uploadedAt = payload.uploadedAt ?? null;
	}

	getCorrespondenceSubjectId(): string {
		return this.id;
	}
}

export default CorrespondenceSubject;
