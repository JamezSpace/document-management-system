import type CreateInviteUseCase from "../../../application/usecases/user/invites/CreateInvite.usecase.js";
import type GetAllInvitesUecase from "../../../application/usecases/user/invites/GetAllInvites.usecase.js";
import type NudgeInviteUsecase from "../../../application/usecases/user/invites/NudgeInvite.usecase.js";
import type { InitInviteType } from "../../types/user/user.type.js";


class InvitesController {
	constructor(
        private readonly createInviteUsecase: CreateInviteUseCase,
        private readonly getAllInvitesUsecase: GetAllInvitesUecase,
        private readonly nudgeInviteUsecase: NudgeInviteUsecase
	) {}

    async initInvite(payload: InitInviteType){
        const userId =
			await this.createInviteUsecase.inviteStaff(payload);

		return userId;
    }

    async getAllInvites() {
        const invites = await this.getAllInvitesUsecase.execute();

        return invites;
    }

    async nudgeInvite(inviteId: string) {
        const sentStatus = await this.nudgeInviteUsecase.execute(inviteId);

        return sentStatus;
    }
}

export default InvitesController;
