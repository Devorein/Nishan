import { NotionFabricator } from '../../libs';

it(`Should create query2 and return aggregations`, () => {
	const view: any = {};
	const aggregations = NotionFabricator.InitializeView.aggregation(view);
	expect(aggregations).toStrictEqual([]);
	expect(view).toStrictEqual({
		query2: {
			aggregations: []
		}
	});
});

it(`Should create and return aggregations`, () => {
	const view: any = { query2: { sort: [] } };
	const aggregations = NotionFabricator.InitializeView.aggregation(view);
	expect(aggregations).toStrictEqual([]);
	expect(view).toStrictEqual({
		query2: {
			sort: [],
			aggregations: []
		}
	});
});
