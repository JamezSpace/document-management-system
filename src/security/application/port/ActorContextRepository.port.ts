import type { ActorResolution } from "../type/authorization.type.js";

interface ActorContextRepositoryPort {
	resolveByAuthProviderId(authProviderId: string): Promise<ActorResolution | null>;
}

export type { ActorContextRepositoryPort };
