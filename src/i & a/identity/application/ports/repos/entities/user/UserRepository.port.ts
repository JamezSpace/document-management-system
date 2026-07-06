import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import Identity from "../../../../../domain/entities/user/Identity.js";

/**
 * This is an abstraction of the repository layer that lies within application layer and actual implementation layer.
 *
 * All actual repositories (database layer) must implement this interface.
 */
interface IdentityRepositoryPort {
	findIdentityByAuthProviderId(authProviderId: string): Promise<Identity | null>

	findAllUsers(): Promise<Identity[]>;

	save(payload: {
		authProvider: string;
		identity: Identity;
	}, tx?: TransactionContext): Promise<Identity>;

    updateIdentityStatus(uid: string, status: string): Promise<Identity>;
}

export type { IdentityRepositoryPort };

