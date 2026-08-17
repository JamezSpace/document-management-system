import { GlobalEventTypes } from "../../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../../shared/application/port/services/eventbus.port.js";
import type { AccessEventsPort } from "../../application/ports/AccessEvents.port.js";
import type Role from "../../domain/role/Role.js";

/**
 * This is a wrapper class implementation of the authority event types. This class establishes communication between the subsystem and the eventBus
 */
class AccessEventsAdapter implements AccessEventsPort {
	constructor(private readonly eventBus: EventBusPort) {}

	async officialRoleAssigned(payload: {
		staffId: string;
		role: Role;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.access.OFFICIAL_ROLE_ASSIGNED,
			occurredAt: new Date(),
			payload
		});
	}

	async roleDelegated(payload: {
		staffId: string;
		role: Role;
		delegatedBy: string;
		validTo: Date;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.access.ROLE_DELEGATED,
			occurredAt: new Date(),
			payload
		});
	}

	async roleRevoked(payload: {
		staffId: string;
		role: Role;
		revokedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.access.ROLE_REVOKED,
			occurredAt: new Date(),
			payload
		});
	}

	async roleCreated(payload: {
		roleId: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.access.ROLE_CREATED,
			occurredAt: new Date(),
			payload
		});
	}
}

export default AccessEventsAdapter;
