import _ from "lodash";

// helper function to rehydrate with respect to domain casing
export function transformToCamelCase(entity: any) {
	const objectWithCamelCase = _.mapKeys(entity, (values, keys) =>
		_.camelCase(keys),
	);

	return objectWithCamelCase;
}
