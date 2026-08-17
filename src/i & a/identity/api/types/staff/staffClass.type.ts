import { Type, type Static } from "@fastify/type-provider-typebox";

const createStaffClassificationSchema = Type.Object({
	staffId: Type.String(),
	capabilityClass: Type.String(),
	authorityLevel: Type.Number(),
	effectiveFrom: Type.String({ format: "date-time" }),
	effectiveTo: Type.String({ format: "date-time" }),
});

const editStaffClassificationSchema = Type.Partial(
	Type.Omit(createStaffClassificationSchema, 'effectiveFrom')
);

const closeStaffClassificationSchema = Type.Pick(createStaffClassificationSchema, ['effectiveTo']);

const classificationIdSchema = Type.Object({
	classificationId: Type.String(),
});

type CreateStaffClassificationType = Static<
	typeof createStaffClassificationSchema
>;
type EditStaffClassificationType = Static<typeof editStaffClassificationSchema>;
type CloseStaffClassificationType = Static<typeof closeStaffClassificationSchema>;
type ClassificationIdType = Static<typeof classificationIdSchema>;



export {
    createStaffClassificationSchema, type CreateStaffClassificationType,
    editStaffClassificationSchema, type EditStaffClassificationType,
    classificationIdSchema, type ClassificationIdType,
    closeStaffClassificationSchema, type CloseStaffClassificationType
}