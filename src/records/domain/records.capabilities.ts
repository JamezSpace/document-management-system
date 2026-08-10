const RecordsCapabilities = {
	RECORD_VIEW: "records.record.view",
	RECORD_DECLARE: "records.record.declare",
	LOCATION_VIEW: "records.location.view",
	LOCATION_MANAGE: "records.location.manage",
	LOCATION_PLACE: "records.location.place",
	RETENTION_VIEW: "records.retention.view",
	RETENTION_MANAGE: "records.retention.manage",
	RETENTION_APPLY: "records.retention.apply",
	HOLD_VIEW: "records.hold.view",
	HOLD_CREATE: "records.hold.create",
	HOLD_RELEASE: "records.hold.release",
	TRANSFER_VIEW: "records.transfer.view",
	TRANSFER_CREATE: "records.transfer.create",
	TRANSFER_APPROVE: "records.transfer.approve",
	TRANSFER_COMPLETE: "records.transfer.complete",
	ARCHIVE_CREATE: "records.archive.create",
	DISPOSAL_VIEW: "records.disposal.view",
	DISPOSAL_REQUEST: "records.disposal.request",
	DISPOSAL_APPROVE: "records.disposal.approve",
	DISPOSAL_EXECUTE: "records.disposal.execute",
} as const;

type RecordsCapability =
	(typeof RecordsCapabilities)[keyof typeof RecordsCapabilities];

export { RecordsCapabilities, type RecordsCapability };
