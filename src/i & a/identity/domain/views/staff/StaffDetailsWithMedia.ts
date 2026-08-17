import type { StaffDetailsBasePayload } from "../../type/staffDetailsBasePayload.type.js";
import AbstractStaffDetails from "./AbstractStaffDetails.js";

interface StaffDetailsWithMediaPayload extends StaffDetailsBasePayload {
	media?: {
		profilePicUrl: string | null;
		signatureUrl: string | null;
	};
}

class StaffDetailsWithMedia extends AbstractStaffDetails {
	readonly media: {
		profilePicUrl: string | null;
		signatureUrl: string | null;
	};

	constructor(payload: StaffDetailsWithMediaPayload) {
		super(payload);

		this.media = {
			profilePicUrl: payload.media?.profilePicUrl ?? null,
			signatureUrl: payload.media?.signatureUrl ?? null,
		};
	}
}

export default StaffDetailsWithMedia;
