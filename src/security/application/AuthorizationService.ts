import type {
	ActorContext,
	ActorGrant,
	ResourceScope,
} from "./authorization.types.js";

class AuthorizationService {
	hasCapability(
		actor: ActorContext,
		capability: string,
		resourceScope?: ResourceScope,
	): boolean {
		return actor.grants.some(
			(grant) =>
				grant.capability === capability &&
				this.scopeAllows(grant, resourceScope),
		);
	}

	private scopeAllows(
		grant: ActorGrant,
		resourceScope?: ResourceScope,
	): boolean {
		if (!resourceScope) return true;
		if (grant.scope.type === "organization") return true;
		if (grant.scope.type === "unit") {
			return grant.scope.id === resourceScope.unitId;
		}

		return grant.scope.id === resourceScope.officeId;
	}
}

export default AuthorizationService;
