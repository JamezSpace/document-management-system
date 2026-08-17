import nodemailer from "nodemailer";
import type { GlobalEmailServicePort } from "../../../../application/port/services/emailService.port.js";

class NodemailerEmailServiceAdapter implements GlobalEmailServicePort {
	private readonly transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST ?? "localhost",
		port: Number(process.env.SMTP_PORT ?? 587),
		secure: process.env.SMTP_SECURE === "true",
		auth:
			process.env.SMTP_USER && process.env.SMTP_PASS
				? {
						user: process.env.SMTP_USER,
						pass: process.env.SMTP_PASS,
					}
				: undefined,
	});

	async sendTo(
		payload: { recipientEmail: string; message: string },
		type: "onboarding" | "notification",
	): Promise<boolean> {
		const subject =
			type === "notification"
				? "Notification"
				: "Activation of Your Nexus-Fons Digital Office Account";

		await this.transporter.sendMail({
			from:
				process.env.MAIL_FROM ??
				process.env.SMTP_USER ??
				"no-reply@localhost",
			to: payload.recipientEmail,
			subject,
			text: payload.message,
		});

		return true;
	}
}

export default NodemailerEmailServiceAdapter;
