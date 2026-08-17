import { GlobalEventTypes } from "../../../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../../../shared/application/port/services/eventbus.port.js";
import type { UserEventsPort } from "../../../application/ports/events/user/UserEvents.port.js";

/**
 * This is a wrapper class implementation of the identity & authority event types. This class establishes communication between the subsystem and the eventBus
 */
class IdentityEventsAdapter implements UserEventsPort {
	constructor(private readonly eventBus: EventBusPort) {}
    
    async userActivated(payload: { userId: string }): Promise<void> {
        await this.eventBus.emit({
            eventName: GlobalEventTypes.identity_authority.identity.user.USER_ACTIVATED,
            occurredAt: new Date(),
            payload: {
                userId: payload.userId,
            },
        });
    }

	async userAuthenticated(payload: { userId: string }): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.user.USER_AUTHENTICATED,
			occurredAt: new Date(),
			payload: {
				userId: payload.userId,
			},
		});
	}

	async userAuthenticationFailed(payload: {
		userId?: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.user.USER_AUTHENTICATION_FAILED,
			occurredAt: new Date(),
			payload: {
				userId: payload.userId,
			},
		});
	}

	async userCreated(payload: { userId: string }): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.identity_authority.identity.user.USER_CREATED,
			occurredAt: new Date(),
			payload: {
				userId: payload.userId,
			},
		});
	}
}

export default IdentityEventsAdapter;
