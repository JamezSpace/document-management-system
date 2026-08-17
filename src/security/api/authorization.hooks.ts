import type {
	FastifyInstance,
	FastifyRequest,
	RouteOptions,
} from "fastify";
import type { AuthServicePort } from "../../i & a/identity/application/ports/services/AuthService.port.js";
import ApplicationError from "../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../shared/errors/enum/application.enum.js";
import type { ActorContextRepositoryPort } from "../application/port/ActorContextRepository.port.js";
import AuthorizationService from "../application/services/AuthorizationService.js";
import type { ActorContext, RouteAuthorizationPolicy } from "../application/type/authorization.type.js";


function assertRouteHasAuthorizationPolicy(route: RouteOptions): void {
	// CORS owns the generated preflight route, so it has no application policy.
	const methods = Array.isArray(route.method) ? route.method : [route.method];
	if (methods.every((method) => method === "OPTIONS")) return;

	const policy = route.config?.authorization;

	if (!policy) {
		throw new Error(
			`Route ${String(route.method)} ${route.url} has no authorization policy`,
		);
	}
}

function registerAuthorizationHooks(
	fastify: FastifyInstance,
	dependencies: {
		authService: AuthServicePort;
		actorRepository: ActorContextRepositoryPort;
		authorizationService?: AuthorizationService;
	},
): void {
	const authorizationService =
		dependencies.authorizationService ?? new AuthorizationService();

	fastify.addHook("onRoute", assertRouteHasAuthorizationPolicy);
	fastify.addHook("preHandler", async (request) => {
		const policy = request.routeOptions.config
			.authorization as RouteAuthorizationPolicy;

		if (policy.kind === "public") return;

		const token = extractBearerToken(request);
		const authProviderId = await dependencies.authService.verifyIdToken(token);
		request.user = { uid: authProviderId };

		if (policy.kind === "authenticated-identity") return;

		const resolution =
			await dependencies.actorRepository.resolveByAuthProviderId(
				authProviderId,
			);

		if (!resolution || !resolution.staff) {
			throw new ApplicationError(
				ApplicationErrorEnum.USER_NOT_AUTHORIZED,
				{ message: "The authenticated identity is not an internal staff member" },
			);
		}

		if (
			resolution.identityStatus !== "active" ||
			resolution.staff.status !== "active"
		) {
			throw new ApplicationError(
				ApplicationErrorEnum.USER_NOT_AUTHORIZED,
				{ message: "The staff account is not active" },
			);
		}

		const actor: ActorContext = {
			identityId: resolution.identityId,
			staffId: resolution.staff.id,
			officeId: resolution.staff.officeId,
			unitId: resolution.staff.unitId,
			grants: resolution.grants,
		};
		request.actor = actor;

		if (
			policy.kind === "capability" &&
			!authorizationService.hasCapability(actor, policy.capability)
		) {
			throw new ApplicationError(
				ApplicationErrorEnum.USER_NOT_AUTHORIZED,
				{ message: `Missing capability: ${policy.capability}` },
			);
		}
	});
}

function extractBearerToken(request: FastifyRequest): string {
	const authorization = request.headers.authorization;

	if (!authorization) {
		throw new ApplicationError(
			ApplicationErrorEnum.USER_NOT_AUTHENTICATED,
			{ message: "Missing Authorization header" },
		);
	}

	const [scheme, token, extra] = authorization.trim().split(/\s+/);
	if (scheme !== "Bearer" || !token || extra) {
		throw new ApplicationError(
			ApplicationErrorEnum.USER_NOT_AUTHENTICATED,
			{ message: "Authorization must contain one Bearer token" },
		);
	}

	return token;
}

export { assertRouteHasAuthorizationPolicy, registerAuthorizationHooks };
