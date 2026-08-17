import ApplicationError from "../../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../../shared/errors/enum/application.enum.js";
import type { UserEventsPort } from "../../ports/events/user/UserEvents.port.js";
import type { IdentityRepositoryPort } from "../../ports/repos/entities/user/UserRepository.port.js";

class AuthenticateUserUseCase {
    
    constructor(private readonly identityRepository: IdentityRepositoryPort, private readonly identityEvents: UserEventsPort) { }

    async authenticateUser(authProviderId: string){
        // pull user's identity from repo after authentication with external provider
        const userIdentity = await this.identityRepository.findIdentityByAuthProviderId(authProviderId);

        if (!userIdentity)
            throw new ApplicationError(ApplicationErrorEnum.IDENTITY_NOT_FOUND, {
            message:"User authenticated externally but has no system identity",
            details: {
                userId: authProviderId
            }
        })

        // emit user authenticated event
        await this.identityEvents.userAuthenticated({
            userId: userIdentity.getUserId()
        });
        
        // return user identity
        return userIdentity;
    }
}

export default AuthenticateUserUseCase;
