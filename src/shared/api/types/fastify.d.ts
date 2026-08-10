import "fastify";
import type {
	ActorContext,
	RouteAuthorizationPolicy,
} from "../../../security/application/authorization.types.js";

declare module "fastify" {
	interface FastifyRequest {
		user: {
			uid: string;
			email?: string;
		} | null;
		actor: ActorContext | null;
	}

	interface FastifyContextConfig {
		authorization?: RouteAuthorizationPolicy;
	}
}
