import { Type, type Static } from "@fastify/type-provider-typebox";
import { MinuteAction } from "../../domain/enum/MinuteAction.enum.js";

const documentIdSchema = Type.Object({
	documentId: Type.String(),
});

const minuteIdSchema = Type.Object({
	minuteId: Type.String(),
});

const minuteSchema = Type.Object({
	id: Type.String(),
	documentId: Type.String(),
	authorStaffId: Type.String(),
	inboxEntryId: Type.Union([Type.String(), Type.Null()]),
	parentMinuteId: Type.Union([Type.String(), Type.Null()]),
	action: Type.Enum(MinuteAction),
	content: Type.Union([Type.String(), Type.Null()]),
	createdAt: Type.String({ format: "date-time" }),
});

const documentMinuteParamsSchema = Type.Object({
	documentId: Type.String(),
	minuteId: Type.String(),
});

const minuteSchemaForCreation = Type.Object(
	{
		action: Type.Enum(MinuteAction),
		content: Type.String(),
		inboxEntryId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
		parentMinuteId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
	},
	{ additionalProperties: false },
);

type DocumentIdSchemaType = Static<typeof documentIdSchema>;
type MinuteIdSchemaType = Static<typeof minuteIdSchema>;
type MinuteSchemaType = Static<typeof minuteSchema>;
type MinuteSchemaForCreationType = Static<typeof minuteSchemaForCreation>;
type DocumentMinuteParamsSchemaType = Static<typeof documentMinuteParamsSchema>;

export {
    documentIdSchema,
    documentMinuteParamsSchema,
    minuteIdSchema,
    minuteSchema,
    minuteSchemaForCreation,
    type DocumentIdSchemaType,
    type DocumentMinuteParamsSchemaType,
    type MinuteIdSchemaType,
    type MinuteSchemaForCreationType,
    type MinuteSchemaType
};
