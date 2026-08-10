import type { ActorResolution } from "./authorization.types.js";

interface ActorContextRepositoryPort {
	resolveByAuthProviderId(authProviderId: string): Promise<ActorResolution | null>;
}

export type { ActorContextRepositoryPort };
