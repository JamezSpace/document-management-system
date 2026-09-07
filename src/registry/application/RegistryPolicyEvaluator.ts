import ApplicationError from "../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../shared/errors/enum/application.enum.js";
import AuthorizationService from "../../security/application/services/AuthorizationService.js";
import type { ActorContext } from "../../security/application/type/authorization.type.js";
import type { DigitizationJob, RegistryEntry, RegistryIntake } from "../domain/registry.models.js";
import { RegistryCapabilities } from "../domain/enum/registryCapabilities.enum.js";

type RegistryResource =
	| { kind: "intake"; value: RegistryIntake }
	| { kind: "digitization"; value: DigitizationJob; intake: RegistryIntake }
	| { kind: "entry"; value: RegistryEntry };

class RegistryPolicyEvaluator {
	constructor(private readonly authorization = new AuthorizationService()) {}

	allowedActions(actor: ActorContext, resource: RegistryResource): string[] {
		const result: string[] = [];
		const scope = this.scopeOf(resource);
		const can = (capability: string) =>
			this.authorization.hasCapability(actor, capability, scope);

		if (can(RegistryCapabilities.INTAKE_VIEW)) {
			result.push(RegistryCapabilities.INTAKE_VIEW);
		}

		if (resource.kind === "intake") {
			const { status } = resource.value;
			if (can(RegistryCapabilities.INTAKE_UPDATE) && ["received", "awaiting_digitization"].includes(status)) {
				result.push(RegistryCapabilities.INTAKE_UPDATE);
			}
			if (can(RegistryCapabilities.INTAKE_PROCESS) && status === "received") {
				result.push(RegistryCapabilities.INTAKE_PROCESS);
			}
			if (can(RegistryCapabilities.REGISTRATION_CREATE) && status === "ready_for_registration") {
				result.push(RegistryCapabilities.REGISTRATION_CREATE);
			}
		}

		if (resource.kind === "digitization") {
			if (
				can(RegistryCapabilities.DIGITIZATION_VERIFY) &&
				resource.value.status === "awaiting_verification" &&
				resource.value.createdBy !== actor.staffId
			) {
				result.push(RegistryCapabilities.DIGITIZATION_VERIFY);
			}
		}

		if (resource.kind === "entry") {
			if (can(RegistryCapabilities.ENTRY_VIEW)) {
				result.push(RegistryCapabilities.ENTRY_VIEW);
			}
			if (can(RegistryCapabilities.DISPATCH_CREATE) && resource.value.status === "awaiting_dispatch") {
				result.push(RegistryCapabilities.DISPATCH_CREATE);
			}
			if (can(RegistryCapabilities.MOVEMENT_CREATE) && resource.value.status !== "closed") {
				result.push(RegistryCapabilities.MOVEMENT_CREATE);
			}
		}

		return [...new Set(result)];
	}

	assertAllowed(actor: ActorContext, capability: string, resource: RegistryResource): void {
		if (!this.allowedActions(actor, resource).includes(capability)) {
			throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, {
				message: `Action ${capability} is not allowed for the current Registry resource`,
			});
		}
	}

	private scopeOf(resource: RegistryResource): { unitId: string | null; officeId: string | null } {
		if (resource.kind === "digitization") {
			return { unitId: resource.intake.unitId, officeId: resource.intake.officeId };
		}
		return { unitId: resource.value.unitId, officeId: resource.value.officeId };
	}
}

export { type RegistryResource };
export default RegistryPolicyEvaluator;
