import { type Auth, getAuth } from "firebase-admin/auth";
import InfrastructureError from "../../../../../shared/errors/InfrastructureError.error.js";
import {
	Category,
	GlobalInfrastructureErrors,
} from "../../../../../shared/errors/enum/infrastructure.enum.js";
import type { AuthServicePort } from "../../../application/ports/services/AuthService.port.js";
import firebaseApp from "./Firebase.config.js";

class FirebaseAuthAdapter implements AuthServicePort {
	private authInstance!: Auth;

	constructor() {
		this.authInstance = getAuth(firebaseApp);
	}

	async verifyIdToken(token: string) {
		try {
			const decodedToken = await this.authInstance.verifyIdToken(
				token,
				true,
			);

			return decodedToken.uid;
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Invalid Firebase ID token";

			throw new InfrastructureError(
				GlobalInfrastructureErrors.auth.ID_TOKEN_INVALID,
				{
					category: Category.AUTH,
					message,
					cause: error,
				},
			);
		}
	}

	async createUser(email: string) {
		try {
			const userRecord = await this.authInstance.createUser({ email });

			return {
				authProviderId: userRecord.uid,
			};
		} catch (error: any) {
			// if(error.code.includes('email-alreay-exists'))
			throw new InfrastructureError(
				GlobalInfrastructureErrors.auth.EMAIL_ALREADY_EXISTS,
				{
					category: Category.AUTH,
					message: error.message,
				},
			);
		}
	}

	async generatePasswordSetupLink(email: string, details: {staffId: string, inviteId: string}) {
		const link = await this.authInstance.generatePasswordResetLink(email);

		const url = new URL(link);
		const oobCode = url.searchParams.get("oobCode");

		if (!oobCode) {
			throw new Error("Failed to extract oobCode from reset link");
		}

		const customLink = `${process.env.FRONTEND_ORIGIN}/staff/passwordReset?oobCode=${oobCode}&sid=${details.staffId}&iid=${details.inviteId}`;

		return customLink;
	}
}

export default FirebaseAuthAdapter;
