import type { InviteRepositoryPort } from "../../../ports/repos/entities/user/InviteRepository.port.js";

class GetAllInvitesUecase {
    constructor(
        private readonly inviteRepo: InviteRepositoryPort,
    ) {}

    async execute() {
        const invites = this.inviteRepo.fetchAll()

        return invites;
    }
}

export default GetAllInvitesUecase;