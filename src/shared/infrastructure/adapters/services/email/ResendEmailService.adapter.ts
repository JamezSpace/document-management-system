import { Resend } from "resend";
import type { GlobalEmailServicePort } from "../../../../application/port/services/emailService.port.js";

class ResendEmailServiceAdapter implements GlobalEmailServicePort {
	resend: Resend;

	constructor() {
		this.resend = new Resend(process.env.RESEND_API_KEY);
	}

	async sendTo(
		payload: { recipientEmail: string; message: string },
		type: "onboarding" | "notification",
	): Promise<boolean> {
		let subject =
			type === "notification"
				? "Notification"
				: "Activation of Your Nexus-Fons Digital Office Account";

		const maxRetries = 3;
		const messageType = type;
		const { recipientEmail, message } = payload;
		// const { data, error } = await this.resend.emails.send({
		// 	from: "onboarding@resend.dev",
		// 	to: recipientEmail,
		// 	subject,
		// 	html: message,
		// });

		// if (error) {
		// 	console.error("Resend error:", error);

		// 	const nextRetryCount = numOfRetries + 1;

		// 	if (nextRetryCount >= 3) {
		// 		console.log("Terminating after 3 attempts");

		// 		throw new Error("Email sending failed after max retries");
		// 	}

		// 	console.log(`Retry attempt: ${nextRetryCount}`);

		// 	return await this.sendTo({ recipientEmail, message }, messageType);
		// }

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const { data, error } = await this.resend.emails.send({
					from: "onboarding@resend.dev",
					to: payload.recipientEmail,
					subject,
					html: payload.message,
				});

				if (error) throw error;

				console.log("Resend success:", data);
				return true; // Exit the whole function on success
			} catch (err) {
				console.error(`Attempt ${attempt} failed:`, err);

				if (attempt === maxRetries) {
					throw new Error("Email sending failed after 3 attempts");
				}

				// add a small delay (backoff) before next attempt
				// await new Promise(res => setTimeout(res, 1000));
			}
		}

		return false;
	}
}

export default ResendEmailServiceAdapter;
