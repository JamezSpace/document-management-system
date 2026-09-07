type WorkItemView = "assigned" | "returned" | "completed";

interface WorkItemAuthority {
	actorId: string | null;
	designationId: string | null;
	displayName: string;
	role: string;
}

interface WorkItemVersion {
	id: string;
	number: number;
	label: string;
	integrityStatus: string;
}

interface WorkItemDocument {
	id: string;
	reference: string;
	title: string;
	classification: string;
	sensitivity: string;
	version: WorkItemVersion;
}

interface WorkItemActivity {
	id: string;
	event: string;
	actor: WorkItemAuthority;
	occurredAt: Date;
	evidenceId: string | null;
}

interface WorkItem {
	id: string;
	view: WorkItemView;
	status: string;
	document: WorkItemDocument;
	instruction: string;
	assigningAuthority: WorkItemAuthority;
	assignedAt: Date;
	dueAt?: Date;
	progressLabel?: string | null;
	returnedAt?: Date;
	returnedBy?: WorkItemAuthority;
	returnReason?: string;
	requiredCorrection?: string;
	resubmissionDueAt?: Date;
	previousSubmission?: WorkItemVersion & { submittedAt: Date };
	outcome?: string;
	completedAt?: Date;
	finalAuthority?: WorkItemAuthority;
	resultingState?: string;
	authoritativeVersion?: WorkItemVersion;
	activity?: WorkItemActivity[];
}

interface WorkItemQuery {
	view: WorkItemView;
	workItemId?: string;
	search?: string;
	authorityId?: string;
	status?: string;
	dueFrom?: Date;
	dueTo?: Date;
	completedFrom?: Date;
	completedTo?: Date;
	sort: "newest" | "oldest";
	limit: number;
	cursorAt?: Date;
	cursorId?: string;
}

export type {
	WorkItem,
	WorkItemActivity,
	WorkItemAuthority,
	WorkItemDocument,
	WorkItemQuery,
	WorkItemVersion,
	WorkItemView,
};
