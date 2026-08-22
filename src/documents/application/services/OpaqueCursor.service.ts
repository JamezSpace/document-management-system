import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";

class OpaqueCursor {
	static encode(payload: Record<string, string>) {
		return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
	}

	static decode(cursor: string | undefined, requiredKeys: string[]) {
		if (!cursor) return null;
		try {
			const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Record<string, unknown>;
			if (requiredKeys.some((key) => typeof parsed[key] !== "string")) throw new Error("missing cursor field");
			return parsed as Record<string, string>;
		} catch {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Cursor is invalid or malformed",
			});
		}
	}
}

export default OpaqueCursor;
