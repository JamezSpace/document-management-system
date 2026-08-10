import type { FastifyInstance, FastifyRequest } from "fastify";
import type NotificationController from "../controllers/NotificationController.js";
import {
	staffIdSchema,
	type StaffIdType,
} from "../types/notifications.type.js";
import { routePolicies } from "../../../security/application/authorization.types.js";
import ApiError from "../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../shared/errors/enum/api.enum.js";

async function notificationRoutes(
	fastify: FastifyInstance,
	options: {
		controller: NotificationController;
	},
) {
	const notificationController = options.controller;

	fastify.get(
		"/:sId",
		{
			config: { authorization: routePolicies.authenticatedSelf },
			schema: { params: staffIdSchema },
		},
		async (request: FastifyRequest<{ Params: StaffIdType }>, reply) => {
			const { sId: staffId } = request.params;

			if (request.actor!.staffId !== staffId) {
				throw new ApiError(ApiErrorEnum.NOT_ALLOWED, {
					message: "Staff may only access their own notifications",
				});
			}

			const notifications =
				await notificationController.getStaffNotifications(staffId);

			return reply.code(200).send({
				success: true,
				data: notifications,
			});
		},
	);
}

export default notificationRoutes;
