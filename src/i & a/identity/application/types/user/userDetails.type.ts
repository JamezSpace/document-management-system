import type { IdentityStatus } from "../../../domain/entities/user/IdentityStatus.js";

interface User {
    uid: string;
    email: string;
    phoneNum: string;
    status: IdentityStatus;
    authProvider: string;
    authProviderId: string;
    firstName: string;
    lastName: string;
    middleName: string;
}

export type { User };

