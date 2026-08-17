import _ from "lodash";

export const generateMessageTemplate = (payload: {
	eventType: string;
	subjectType: string;
	inAppSubjectName: string;
	actorFirstName?: string | null;
	actorLastName?: string | null;
}): string => {
	const formattedSubjectType = _.toLower(payload.subjectType);

	const actorFullName =
		payload.actorFirstName && payload.actorLastName
			? _.join(
					[
						_.startCase(_.toLower(payload.actorLastName)),
						_.startCase(_.toLower(payload.actorFirstName)),
					],
					" ",
			  )
			: null;

	switch (payload.eventType) {
		case "business_function_created":
			return `A new ${formattedSubjectType}, "${payload.inAppSubjectName}" was created${
				actorFullName ? ` by ${actorFullName}` : ""
			}.`;

		case "workflow_tasks_assigned":
			return `You have a pending ${formattedSubjectType} task: "${payload.inAppSubjectName}".`;

		case "document_submitted":
			return `A document "${payload.inAppSubjectName}" has been submitted for review${
				actorFullName ? ` by ${actorFullName}` : ""
			}.`;

		default:
			return `${_.startCase(payload.eventType)} occurred on "${payload.inAppSubjectName}".`;
	}
};
