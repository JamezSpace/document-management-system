import {
	GlobalInfrastructureErrors
} from "../../../../errors/enum/infrastructure.enum.js";

export function mapPostgresError(err: any) {
	// checking for Postgres unique constraint violation
	switch (err.code) {
		case "23505":
			return {
				summary:
					GlobalInfrastructureErrors.persistence
						.UNIQUE_CONSTRAINT_VIOLATION,
				details: err,
			};

		case "42P01":
			return {
				summary: GlobalInfrastructureErrors.persistence.NOT_FOUND,
				details: err,
			};

		case "23503":
			return {
				summary: GlobalInfrastructureErrors.persistence.UNIQUE_CONSTRAINT_VIOLATION,
				details: err,
			};

		case "22P02":
			return {
				summary: GlobalInfrastructureErrors.persistence.INVALID_INPUT_VALUE,
				details: err,
			};

		default:
			return {
				summary:
					GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
				details: err,
			};
	}
}
