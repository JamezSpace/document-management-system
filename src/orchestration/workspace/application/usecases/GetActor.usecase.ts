import type { OrchestrationIdentityPort } from "../../../../shared/application/port/intersubsystem/OrchestrationIdentity.port.js";

class GetActorUsecase {
    constructor(
        private readonly orchestrationIdentityPort: OrchestrationIdentityPort
    ) {}

     async execute(actorUid: string) {
        const staff = await this.orchestrationIdentityPort.getStaffFromUid(actorUid);

        return staff;
    }
}

export default GetActorUsecase;