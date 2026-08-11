import { strict as assert } from "node:assert";
import { test } from "node:test";

import fastify, { type FastifyInstance } from "fastify";

import type { AuthServicePort } from "../../src/i & a/identity/application/ports/services/AuthService.port.js";
import {
	registerAuthorizationHooks,
} from "../../src/security/api/authorization.hooks.js";
import type { ActorContextRepositoryPort } from "../../src/security/application/ActorContextRepository.port.js";
import {
	routePolicies,
	type ActorResolution,
} from "../../src/security/application/authorization.types.js";
import NexusError from "../../src/shared/errors/NexusError.js";

class FakeAuthService implements AuthServicePort {
	readonly verifiedTokens: string[] = [];

	constructor(private readonly authProviderId = "firebase-user-1") {}

	async verifyIdToken(token: string): Promise<string> {
		this.verifiedTokens.push(token);
		return this.authProviderId;
	}

	async createUser(): Promise<{ authProviderId: string }> {
		return { authProviderId: this.authProviderId };
	}

	async generatePasswordSetupLink(): Promise<string> {
		return "https://example.test/password-setup";
	}
}

class FakeActorRepository implements ActorContextRepositoryPort {
	readonly requestedAuthProviderIds: string[] = [];

	constructor(
		private readonly resolution: ActorResolution | null,
		private readonly rejectCalls = false,
	) {}

	async resolveByAuthProviderId(
		authProviderId: string,
	): Promise<ActorResolution | null> {
		this.requestedAuthProviderIds.push(authProviderId);
		if (this.rejectCalls) {
			throw new Error("Actor repository must not be called");
		}

		return this.resolution;
	}
}

function activeResolution(capabilities: string[] = []): ActorResolution {
	return {
		identityId: "identity-1",
		identityStatus: "active",
		staff: {
			id: "staff-1",
			status: "active",
			officeId: "office-1",
			unitId: "unit-1",
		},
		grants: capabilities.map((capability, index) => ({
			assignmentId: `assignment-${index + 1}`,
			role: "staff_member",
			capability,
			scope: { type: "organization", id: null },
			validFrom: new Date("2026-08-01T00:00:00.000Z"),
			validTo: null,
		})),
	};
}

function authorizationTestApp(
	authService: FakeAuthService,
	actorRepository: FakeActorRepository,
): FastifyInstance {
	const app = fastify({ logger: false });
	app.decorateRequest("user", null);
	app.decorateRequest("actor", null);

	registerAuthorizationHooks(app, { authService, actorRepository });
	app.setErrorHandler((error, _request, reply) => {
		if (error instanceof NexusError) {
			return reply.code(error.httpStatusCode).send({
				code: error.errorCode,
				message: error.message,
			});
		}

		return reply.code(500).send({ code: "internal_server_error" });
	});

	return app;
}

test("route registration rejects application routes without an authorization policy", () => {
	const app = authorizationTestApp(
		new FakeAuthService(),
		new FakeActorRepository(null),
	);

	assert.throws(
		() => app.get("/unprotected", async () => ({ ok: true })),
		/Route GET \/unprotected has no authorization policy/,
	);
});

test("OPTIONS routes are exempt from the application policy assertion", async (t) => {
	const authService = new FakeAuthService();
	const actorRepository = new FakeActorRepository(null);
	const app = authorizationTestApp(authService, actorRepository);
	t.after(() => app.close());

	app.options("/preflight", async () => ({ ok: true }));
	await app.ready();

	assert.equal(app.hasRoute({ method: "OPTIONS", url: "/preflight" }), true);
	assert.deepEqual(authService.verifiedTokens, []);
	assert.deepEqual(actorRepository.requestedAuthProviderIds, []);
});

test("public policies do not verify an authentication token", async (t) => {
	const authService = new FakeAuthService();
	const actorRepository = new FakeActorRepository(null);
	const app = authorizationTestApp(authService, actorRepository);
	t.after(() => app.close());

	app.get(
		"/public",
		{ config: { authorization: routePolicies.public } },
		async (request) => ({ user: request.user }),
	);

	const response = await app.inject({ method: "GET", url: "/public" });

	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.json(), { user: null });
	assert.deepEqual(authService.verifiedTokens, []);
	assert.deepEqual(actorRepository.requestedAuthProviderIds, []);
});

test("authenticated identity verifies Firebase and skips staff actor resolution", async (t) => {
	const authService = new FakeAuthService("firebase-identity-only");
	const actorRepository = new FakeActorRepository(null, true);
	const app = authorizationTestApp(authService, actorRepository);
	t.after(() => app.close());

	app.get(
		"/identity-only",
		{ config: { authorization: routePolicies.authenticatedIdentity } },
		async (request) => ({ user: request.user, actor: request.actor }),
	);

	const response = await app.inject({
		method: "GET",
		url: "/identity-only",
		headers: { authorization: "Bearer firebase-token" },
	});

	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.json(), {
		user: { uid: "firebase-identity-only" },
		actor: null,
	});
	assert.deepEqual(authService.verifiedTokens, ["firebase-token"]);
	assert.deepEqual(actorRepository.requestedAuthProviderIds, []);
});

test("authenticated self resolves and exposes an active staff actor", async (t) => {
	const authService = new FakeAuthService();
	const actorRepository = new FakeActorRepository(activeResolution());
	const app = authorizationTestApp(authService, actorRepository);
	t.after(() => app.close());

	app.get(
		"/self",
		{ config: { authorization: routePolicies.authenticatedSelf } },
		async (request) => ({ actor: request.actor }),
	);

	const response = await app.inject({
		method: "GET",
		url: "/self",
		headers: { authorization: "Bearer firebase-token" },
	});

	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.json(), {
		actor: {
			identityId: "identity-1",
			staffId: "staff-1",
			officeId: "office-1",
			unitId: "unit-1",
			grants: [],
		},
	});
	assert.deepEqual(actorRepository.requestedAuthProviderIds, ["firebase-user-1"]);
});

test("capability policy rejects an active actor without the required grant", async (t) => {
	const authService = new FakeAuthService();
	const actorRepository = new FakeActorRepository(
		activeResolution(["document.view"]),
	);
	const app = authorizationTestApp(authService, actorRepository);
	t.after(() => app.close());

	app.post(
		"/documents",
		{ config: { authorization: routePolicies.capability("document.create") } },
		async () => ({ created: true }),
	);

	const response = await app.inject({
		method: "POST",
		url: "/documents",
		headers: { authorization: "Bearer firebase-token" },
	});

	assert.equal(response.statusCode, 403);
	assert.deepEqual(response.json(), {
		code: "user_not_authorized",
		message: "Missing capability: document.create",
	});
});

test("capability policy accepts an active actor with the required grant", async (t) => {
	const authService = new FakeAuthService();
	const actorRepository = new FakeActorRepository(
		activeResolution(["document.create"]),
	);
	const app = authorizationTestApp(authService, actorRepository);
	t.after(() => app.close());

	app.post(
		"/documents",
		{ config: { authorization: routePolicies.capability("document.create") } },
		async (request) => ({ staffId: request.actor?.staffId }),
	);

	const response = await app.inject({
		method: "POST",
		url: "/documents",
		headers: { authorization: "Bearer firebase-token" },
	});

	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.json(), { staffId: "staff-1" });
});
