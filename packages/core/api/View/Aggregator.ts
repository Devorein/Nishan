import { ITableView, IBoardView, ITimelineView, TCollectionBlock, ICollection, ViewAggregations, TSchemaUnit } from "@nishans/types";
import { NishanArg, UserViewAggregationsCreateParams, UpdateType, UpdateTypes, FilterType, FilterTypes, ISchemaMap } from "../../types";
import { Operation } from "../../utils";
import View from "./View";

/**
 * A class to represent the aggregrator methods for views that supports it
 * @noInheritDoc
 */
class Aggregator<T extends ITableView | IBoardView | ITimelineView> extends View<T> {
  constructor(arg: NishanArg) {
    super({ ...arg });
  }

  #getCollection = () => {
    return this.cache.collection.get((this.cache.block.get(this.getCachedData().parent_id) as TCollectionBlock).collection_id) as ICollection
  }

  #populateAggregations = () => {
    const data = this.getCachedData();
    if (!data.query2) data.query2 = { aggregations: [] } as any;
    if (data.query2 && !data.query2?.aggregations) data.query2.aggregations = [];
    return (data.query2 as any).aggregations as ViewAggregations[]
  }

  #getSchemaMap = () => {
    const collection = this.#getCollection(), schema_map: ISchemaMap = new Map();
    Object.entries(collection.schema).forEach(([schema_id, value]) => {
      schema_map.set(value.name, {
        schema_id,
        ...value
      }
      )})
    return schema_map;
  }

  #getAggregationsMap = () => {
    const data = this.getCachedData(), collection = this.#getCollection(),
      aggregations_map: Record<string, TSchemaUnit & ViewAggregations> = {}, aggregations = this.#populateAggregations();
    data.query2?.aggregations?.forEach(aggregation => {
      const schema_unit = collection.schema[aggregation.property];
      aggregations_map[schema_unit.name] = {
        ...schema_unit,
        ...aggregation
      }
    });

    return [aggregations_map, aggregations] as const;
  }

  async createAggregation(arg: UserViewAggregationsCreateParams) {
    await this.createAggregations([arg])
  }

  async createAggregations(args: UserViewAggregationsCreateParams[]) {
    const data = this.getCachedData(), schema_map = this.#getSchemaMap(), [, aggregations] = this.#getAggregationsMap();
    for (let index = 0; index < args.length; index++) {
      const { aggregator, name } = args[index];
      aggregations.push({
        property: schema_map.get(name)?.schema_id ?? name,
        aggregator
      })
    };

    this.stack.push(Operation.collection_view.update(this.id, [], {
      query2: data.query2,
    }))
  }

  async updateAggregation(arg: UpdateType<TSchemaUnit & ViewAggregations, Omit<UserViewAggregationsCreateParams, "name">>) {
    await this.updateAggregations(typeof arg === "function" ? arg : [arg],  false);
  }

  async updateAggregations(args: UpdateTypes<TSchemaUnit & ViewAggregations, Omit<UserViewAggregationsCreateParams, "name">>, multiple?: boolean) {
    const data = this.getCachedData(), [aggregations_map, aggregations] = this.#getAggregationsMap();
    await this.updateIterate<TSchemaUnit & ViewAggregations, Omit<UserViewAggregationsCreateParams, "name">>(args, {
      child_ids: Object.keys(aggregations_map),
      child_type: "collection_view",
      manual: true,
      multiple
    }, (name) => aggregations_map[name], (_, original_data, updated_data) => {
      const aggregation = aggregations[aggregations.findIndex(data => data.property === original_data.property)], { aggregator } = updated_data;
      aggregation.aggregator = aggregator;
    })

    this.stack.push(Operation.collection_view.update(this.id, [], {
      query2: data.query2,
    }))
  }

  async deleteAggregation(arg: FilterType<TSchemaUnit & ViewAggregations>) {
    await this.deleteAggregations(typeof arg === "string" ? [arg] : arg,  false);
  }

  async deleteAggregations(args: FilterTypes<TSchemaUnit & ViewAggregations>, multiple?: boolean) {
    const [aggregations_map, aggregations] = this.#getAggregationsMap(), data = this.getCachedData();
    await this.deleteIterate<TSchemaUnit & ViewAggregations>(args, {
      child_type: "collection_view",
      multiple,
      child_ids: Object.keys(aggregations_map),
      manual: true
    }, (name) => aggregations_map[name], (_, aggregation) => {
      aggregations.splice(aggregations.findIndex(data => data.property === aggregation.property), 1)
    })
    this.stack.push(Operation.collection_view.update(this.id, [], {
      query2: data.query2
    }))
  }
}

export default Aggregator;