import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { routePolicies } from "../../../../../security/application/authorization.types.js";
import ApiError from "../../../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../../../shared/errors/enum/api.enum.js";
import AuthenticationController from "../../controllers/user/Authentication.controller.js";
import {
	editOnboardingSessionSchema,
	initOnboardingSessionSchema,
	inviteIdSchema,
	sessionIdSchema,
	tokenIdSchema,
	uploadOnboardingMediaSchema,
	type EditOnboardingSessionType,
	type InitOnboardingSessionType,
	type InviteIdType,
	type SessionIdType,
	type TokenIdType,
	type UploadOnboardingMediaType,
} from "../../types/user/user.type.js";
import { InviteStatus } from "../../../domain/enum/staff.enum.js";
import { IdentityCapabilities } from "../../../domain/enum/identityCapabilities.enum.js";

async function identityRoutes(
	fastify: FastifyInstance,
	options: { controller: AuthenticationController },
) {
	const authenticationController = options.controller;

	const resolveFilePayload = async (
		file: unknown,
		fieldName: string,
	): Promise<{ buffer: Buffer; mimeType?: string }> => {
		if (Buffer.isBuffer(file)) return { buffer: file };

		if (file && typeof file === "object") {
			const mimeType = (file as { mimetype?: string }).mimetype;
			const value = (file as { value?: unknown }).value;
			if (Buffer.isBuffer(value)) {
				return mimeType
					? { buffer: value, mimeType }
					: { buffer: value };
			}

			const toBuffer = (file as { toBuffer?: () => Promise<Buffer> })
				.toBuffer;
			if (typeof toBuffer === "function") {
				const buffer = await toBuffer();
				return mimeType ? { buffer, mimeType } : { buffer };
			}
		}

		throw new ApiError(ApiErrorEnum.BAD_REQUEST, {
			message: `Invalid file payload for ${fieldName}`,
		});
	};

	// fetch all users in the system
	fastify.get(
		"/users",
		{
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.STAFF_LIST,
				),
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { uid } = request.user!;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			const users = await authenticationController.getAllUsers();

			return reply.code(200).send({
				success: true,
				data: users,
			});
		},
	);

	// fetch entity that is onboarding
	fastify.get(
		"/entity/:token",
		{
			schema: { params: tokenIdSchema },
			config: { authorization: routePolicies.public },
		},
		async (
			request: FastifyRequest<{ Params: TokenIdType }>,
			reply: FastifyReply,
		) => {
			const token = request.params.token;

			const invite = await authenticationController.getInvite(token);

			if (!invite) {
				throw new ApiError(ApiErrorEnum.NOT_FOUND, {
					message: `Invite with token ${token} doesn't exist.`,
				});
			} else if (new Date(invite.expiresAt) <= new Date()) {
				await authenticationController.updateInviteField(
					invite.id,
					"status",
					InviteStatus.EXPIRED,
				);

				throw new ApiError(ApiErrorEnum.NOT_ALLOWED, {
					message: "Token has expired",
				});
			} else {
				return reply.code(200).send({
					success: true,
					data: {
						type: "staff",
						details: invite,
					},
				});
			}
		},
	);

	// TODO: replace public onboarding session access with an invite-token-bound policy.
	// get an onboarding session
	fastify.get(
		"/invite/:inviteId/onboarding/session",
		{
			schema: { params: inviteIdSchema },
			config: { authorization: routePolicies.public },
		},
		async (
			request: FastifyRequest<{ Params: InviteIdType }>,
			reply: FastifyReply,
		) => {
			const { inviteId } = request.params;

			const onboardingSession =
				await authenticationController.getOnboardingSession(inviteId);

			return reply.code(200).send({
				success: true,
				data: onboardingSession,
			});
		},
	);

    // get all onboarding sessions
    fastify.get(
		"/invites/onboarding/sessions",
		{
			config: {
				authorization: routePolicies.capability(
					IdentityCapabilities.STAFF_PENDING_ACTIVATION_LIST,
				),
			},
		},
		async (
			request: FastifyRequest,
			reply: FastifyReply,
		) => {
			const { uid } = request.user!;

			if (!uid)
				return reply.code(401).send({
					success: true,
					message: "No uid extracted from access token",
				});

			const onboardingSessions =
				await authenticationController.getAllOnboardingSessions();

			return reply.code(200).send({
				success: true,
				data: onboardingSessions,
			});
		},
	);

	// init an onboarding session
	fastify.post(
		"/invite/onboarding/session",
		{
			schema: { body: initOnboardingSessionSchema },
			config: { authorization: routePolicies.public },
		},
		async (
			request: FastifyRequest<{ Body: InitOnboardingSessionType }>,
			reply: FastifyReply,
		) => {
			const payload = request.body;

			const newOnboardingSession =
				await authenticationController.initOnboardingSession(payload);

			return reply.code(200).send({
				success: true,
				data: newOnboardingSession,
			});
		},
	);

	// update session details
	fastify.patch(
		"/invite/onboarding/session/:sessionId",
		{
			schema: {
				params: sessionIdSchema,
				body: editOnboardingSessionSchema,
			},
			config: { authorization: routePolicies.public },
		},
		async (
			request: FastifyRequest<{
				Params: SessionIdType;
				Body: EditOnboardingSessionType;
			}>,
			reply: FastifyReply,
		) => {
			const sessionId = request.params.sessionId,
				{ primaryData, currentStep } = request.body;

			const updatedOnboardingSession =
				await authenticationController.updateOnboardingSession(
					sessionId,
					{
						primaryData,
						currentStep,
					},
				);

			return reply.code(200).send({
				success: true,
				data: updatedOnboardingSession,
			});
		},
	);

	// upload onboarding media (profile picture or signature)
	fastify.post(
		"/invite/onboarding/session/:sessionId/media",
		{
			schema: {
				params: sessionIdSchema,
				body: uploadOnboardingMediaSchema,
			},
			config: { authorization: routePolicies.public },
		},
		async (
			request: FastifyRequest<{
				Params: SessionIdType;
				Body: UploadOnboardingMediaType;
			}>,
			reply: FastifyReply,
		) => {
			const { sessionId } = request.params;
			const { profilePic, signatureFile, currentStep } = request.body;

			if (!profilePic && !signatureFile) {
				throw new ApiError(ApiErrorEnum.BAD_REQUEST, {
					message: "At least one media file is required.",
				});
			}

			const mediaUploads: {
				profilePic?: { buffer: Buffer; mimeType?: string };
				signatureFile?: { buffer: Buffer; mimeType?: string };
				currentStep: number;
			} = { currentStep };

			if (profilePic) {
				mediaUploads.profilePic = await resolveFilePayload(
					profilePic,
					"profilePic",
				);
			}

			if (signatureFile) {
				mediaUploads.signatureFile = await resolveFilePayload(
					signatureFile,
					"signatureFile",
				);
			}

			const updatedSession =
				await authenticationController.uploadOnboardingMedia(
					sessionId,
					mediaUploads,
				);

			return reply.code(200).send({
				success: true,
				data: updatedSession,
			});
		},
	);

	// complete onboarding session
	fastify.patch(
		"/invite/onboarding/session/:sessionId/completed",
		{
			schema: {
				params: sessionIdSchema,
				body: inviteIdSchema,
			},
			config: { authorization: routePolicies.public },
		},
		async (
			request: FastifyRequest<{
				Params: SessionIdType;
				Body: InviteIdType;
			}>,
			reply: FastifyReply,
		) => {
			const { sessionId } = request.params;
			const { inviteId } = request.body;

            const completedOnboardingSession = await authenticationController.completeOnboardingSession(inviteId, sessionId);

			return reply.code(200).send({
				success: true,
				data: completedOnboardingSession
			});
		},
	);
}

export default identityRoutes;
