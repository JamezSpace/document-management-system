import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type Invite from "../../../../../domain/entities/user/Invite.js";
import type { InvitePayload } from "../../../../../domain/entities/user/Invite.js";
import type { InvitesView } from "../../../../../domain/views/invites/InvitesView.js";

interface InviteRepositoryPort {
    fetchAll(): Promise<InvitesView[]>;
    
	save(payload: InvitePayload): Promise<Invite>;

	findByToken(token: string): Promise<Invite | null>;

    findById(inviteId: string, tx?: TransactionContext): Promise<Invite | null>;

	update(inviteId: string, payload: Partial<Invite>): Promise<Invite>;
}

export type { InviteRepositoryPort };

