enum EmploymentType {
	PERMANENT = "permanent",
	PROBATIONARY = "probationary",
	CONTRACT = "contract",
	INTERN = "intern",
	AD_HOC = "ad_hoc",
	SABBATICAL = "sabbatical",
}

enum Status {
	PENDING = "pending",
	ACTIVE = "active",
	SUSPENDED = "suspended",
	RETIRED = "retired",
	RESIGNED = "resigned",
	TERMINATED = "terminated",
	DELETED = "deleted",
}

enum InviteStatus {
	PENDING = "pending",
	ACCEPTED = "accepted",
	REJECTED = "rejected",
	EXPIRED = "expired"
}

export { Status, InviteStatus, EmploymentType };
