import type { IdentityRepositoryPort } from "../../ports/repos/entities/user/UserRepository.port.js";

class GetAllUsersUseCase {
	constructor(private readonly identityRepo: IdentityRepositoryPort) {}

	async getAllUsers() {
		const users = await this.identityRepo.findAllUsers();

		return users;
	}
}

export default GetAllUsersUseCase;
