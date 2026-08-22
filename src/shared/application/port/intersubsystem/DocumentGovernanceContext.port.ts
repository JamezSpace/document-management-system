import type {
	DocumentGovernanceFacts,
	GovernanceActorRelationship,
} from "./DocumentGovernancePolicy.port.js";

interface ResolvedDocumentGovernanceContext {
	relationships: GovernanceActorRelationship[];
	isAuthenticatedInternalStaff: boolean;
	hasRequiredClearance: boolean;
	hasActiveGuestReaderGrant: boolean;
	guestReaderGrantStatus?: "active" | "expired" | "revoked" | null;
	hasEffectiveUnitHeadSignature: boolean;
	exportGrant: Exclude<DocumentGovernanceFacts["exportGrant"], undefined>;
}

interface DocumentGovernanceContextPort {
	hasRestrictedClearance(actorStaffId: string): Promise<boolean>;

	resolve(
		documentId: string,
		actorStaffId: string,
	): Promise<ResolvedDocumentGovernanceContext>;
}

export type {
	DocumentGovernanceContextPort,
	ResolvedDocumentGovernanceContext,
};
