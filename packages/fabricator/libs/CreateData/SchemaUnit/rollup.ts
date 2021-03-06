import { NotionCache } from '@nishans/cache';
import { NotionErrors } from '@nishans/errors';
import { NotionLogger } from '@nishans/logger';
import { ICollection, ISchemaMap, RollupSchemaUnit } from '@nishans/types';
import { NotionUtils } from '@nishans/utils';
import { INotionFabricatorOptions, TRollupSchemaUnitInput } from '../../';

/**
 * Generate rollup schema unit
 * @param input_schema_unit The rollup schema unit input
 * @param schema_map The schema map used for resolving property reference
 * @param request_config The config object used to make request, validate and cache response
 * @return The newly constructed rollup schema unit
 */
export async function rollup (
	{ aggregation, name, collection_id, relation_property, target_property }: Omit<TRollupSchemaUnitInput, 'type'>,
	schema_map: ISchemaMap,
	options: Pick<INotionFabricatorOptions, 'token' | 'logger' | 'cache' | 'interval' | 'user_id'>
) {
	// Get the related schema unit from the passed schema map
	const relation_schema_unit = NotionUtils.getSchemaMapUnit(schema_map, relation_property, [ 'relation_property' ]);
	// If the schema unit is not of type relation, throw an error as well since only relation schema units can be used in rollup schema unit
	if (relation_schema_unit.type !== 'relation')
		throw new NotionErrors.unsupported_property_type(
			relation_property,
			[ 'relation_property' ],
			relation_schema_unit.type,
			[ 'relation' ]
		);
	// Get the info required for making the request and store in cache
	// Get the target collection from the passed cache
	const target_collection = (await NotionCache.fetchDataOrReturnCached(
		'collection',
		collection_id,
		options
	)) as ICollection;

	// Log the collection read operation
	options.logger && NotionLogger.method.info(`READ collection ${collection_id}`);

	const target_collection_schema_unit_map = NotionUtils.getSchemaMapUnit(
		NotionUtils.generateSchemaMap(target_collection.schema),
		target_property,
		[ 'target_property' ]
	);

	// Construct the rollup schema unit
	return {
		// The related collection id
		collection_id,
		// The name of the related schema unit
		name,
		// The name of the related schema_unit
		relation_property: relation_schema_unit.schema_id,
		type: 'rollup',
		// The type of aggregation used in the schema_unit
		aggregation,
		// The name of the target schema_unit
		target_property: target_collection_schema_unit_map.schema_id,
		// The return type of the target schema unit
		target_property_type: target_collection_schema_unit_map.type
	} as RollupSchemaUnit;
}
