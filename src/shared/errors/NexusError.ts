import type { ErrorDefinition } from "./model/errorDefinition.model.js";
import type { NexusErrorContext } from "./model/errorContext.model.js";

class NexusError extends Error {
	readonly definition: ErrorDefinition;
	readonly details?: Record<string, unknown>;

	constructor(definition: ErrorDefinition, context: NexusErrorContext) {
		super(context.message, { 
			cause: context.cause 
		});

		this.name = this.constructor.name;
		this.definition = definition;
		if (context.details !== undefined) {
			this.details = context.details;
		}

		Object.setPrototypeOf(this, new.target.prototype);
	}

	get errorCode(): string {
		return this.definition.codeName;
	}

	get httpStatusCode() {
		return this.definition.httpStatusCode;
	}

	get category() {
		return this.definition.category;
	}

	get retryable(): boolean {
		return this.definition.retryable ?? false;
	}
}

export default NexusError;
