enum ResourceType {
	DOCUMENT = "document",
	WORKFLOW = "workflow",
	USER = "user",
	SYSTEM = "system",
}

interface AuthorizationResource {
	id?: string;
	type: ResourceType;
}

export type { AuthorizationResource };
