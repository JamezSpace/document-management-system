import IdentityTransition from "./IdentityStatusTransition.js";
import { IdentityStatus } from "./IdentityStatus.js";

/**
 * Local interface defining the requirements for an Identity.
 * This keeps the Domain independent of Application/API DTOs.
 */
interface IdentityPayload {
	readonly id: string;
	readonly authProviderId: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly middleName: string;
	readonly email: string;
    readonly phoneNum: string;
	readonly status: IdentityStatus;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
}

class Identity {
	private readonly id: string;
	private readonly authProviderId: string;
	private readonly email: string;
	private readonly phoneNum: string;
	private readonly firstName: string;
	private readonly lastName: string;
	private readonly middleName: string;
	private readonly createdAt: Date;
	private readonly updatedAt?: Date | undefined;
	private status: IdentityStatus;

	constructor(payload: IdentityPayload) {
		this.id = payload.id;
		this.authProviderId = payload.authProviderId;
		this.firstName = payload.firstName;
		this.lastName = payload.lastName;
		this.middleName = payload.middleName;
		this.email = payload.email;
		this.phoneNum = payload.phoneNum;
		this.status = payload.status;

		this.createdAt = payload.createdAt ?? new Date();
		this.updatedAt = payload.updatedAt;
	}

	// getters
	getUserId(): string {
		return this.id;
	}

	getStatus(): IdentityStatus {
		return this.status;
	}

	getEmail(): string {
		return this.email;
	}

	getCreatedAt(): Date {
		return this.createdAt;
	}

	getUpdatedAt(): Date | null {
		return this.updatedAt ?? null;
	}

	getAuthProviderId() {
		return this.authProviderId;
	}

	getFirstName(): string {
		return this.firstName;
	}

	getLastName(): string {
		return this.lastName;
	}

	getMiddleName(): string {
		return this.middleName;
	}

    getPhoneNumber() {
        return this.phoneNum;   
    }

	activate() {
		IdentityTransition.assertCanActivate(this.status);
		this.status = IdentityStatus.ACTIVE;
	}

	suspend() {
		IdentityTransition.assertCanSuspend(this.status);
		this.status = IdentityStatus.SUSPENDED;
	}

	retire() {
		IdentityTransition.assertCanRetire(this.status);
		this.status = IdentityStatus.RETIRED;
	}

	terminate() {
		IdentityTransition.assertCanTerminate(this.status);
		this.status = IdentityStatus.TERMINATED;
	}

	isActive(): boolean {
		return this.status === IdentityStatus.ACTIVE;
	}
}

export default Identity;
