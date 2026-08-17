import type { DomainErrorType } from "../../../../shared/errors/enum/domain.enum.js";
import DomainError from "../../../../shared/errors/DomainError.error.js";

class AccessDomainError extends DomainError {
	readonly errorName: DomainErrorType;

	constructor(name: DomainErrorType, message?: string) {
		super(name, message ? { message } : {});
		this.errorName = name;
	}
}

export default AccessDomainError;
