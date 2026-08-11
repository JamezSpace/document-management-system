type AuthorizationScope =
	| { type: "organization"; id: null }
	| { type: "unit"; id: string }
	| { type: "office"; id: string };

interface ResourceScope {
	unitId: string | null;
	officeId: string | null;
}

interface ActorGrant {
	assignmentId: string;
	role: string;
	capability: string;
	scope: AuthorizationScope;
	validFrom: Date;
	validTo: Date | null;
}

interface ActorContext {
	identityId: string;
	staffId: string;
	officeId: string | null;
	unitId: string | null;
	grants: ActorGrant[];
}

interface ActorResolution {
	identityId: string;
	identityStatus: string;
	staff: {
		id: string;
		status: string;
		officeId: string | null;
		unitId: string | null;
	} | null;
	grants: ActorGrant[];
}

type RouteAuthorizationPolicy =
	| { kind: "public" }
	| { kind: "authenticated-identity" }
	| { kind: "authenticated-self" }
	| { kind: "capability"; capability: string };

const routePolicies = {
	public: { kind: "public" } as const,
	authenticatedIdentity: { kind: "authenticated-identity" } as const,
	authenticatedSelf: { kind: "authenticated-self" } as const,
	capability: (capability: string): RouteAuthorizationPolicy => ({
		kind: "capability",
		capability,
	}),
};

export {
	routePolicies,
	type ActorContext,
	type ActorGrant,
	type ActorResolution,
	type AuthorizationScope,
	type ResourceScope,
	type RouteAuthorizationPolicy,
};
