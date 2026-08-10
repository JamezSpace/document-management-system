const RegistryCapabilities = {
	INTAKE_VIEW: "registry.intake.view",
	INTAKE_CREATE: "registry.intake.create",
	INTAKE_UPDATE: "registry.intake.update",
	INTAKE_PROCESS: "registry.intake.process",
	INTAKE_VERIFY: "registry.intake.verify",
	DIGITIZATION_VIEW: "registry.digitization.view",
	DIGITIZATION_PROCESS: "registry.digitization.process",
	DIGITIZATION_VERIFY: "registry.digitization.verify",
	REGISTRATION_CREATE: "registry.registration.create",
	ENTRY_VIEW: "registry.entry.view",
	REFERENCE_SERIES_VIEW: "registry.reference_series.view",
	REFERENCE_SERIES_MANAGE: "registry.reference_series.manage",
	DISPATCH_CREATE: "registry.dispatch.create",
	DISPATCH_ACKNOWLEDGE: "registry.dispatch.acknowledge",
	MOVEMENT_VIEW: "registry.movement.view",
	MOVEMENT_CREATE: "registry.movement.create",
	MOVEMENT_RECEIVE: "registry.movement.receive",
	CORRESPONDENCE_VIEW: "registry.correspondence.view",
	CORRESPONDENCE_CREATE: "registry.correspondence.create",
} as const;

type RegistryCapability =
	(typeof RegistryCapabilities)[keyof typeof RegistryCapabilities];

export { RegistryCapabilities, type RegistryCapability };
