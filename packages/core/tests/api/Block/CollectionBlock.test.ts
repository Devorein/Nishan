import { NotionCache } from '@nishans/cache';
import { TViewCreateInput } from '@nishans/fabricator';
import { NotionOperations } from '@nishans/operations';
import { v4 } from "uuid";
import { tsu } from "../../../../fabricator/tests/utils";
import { NotionCore } from "../../../libs";
import { default_nishan_arg, last_edited_props, o } from '../../utils';

afterEach(() => {
	jest.restoreAllMocks();
});

const construct = () =>{
  const collection_1 = {
    id: 'collection_1',
    schema: {
      title: tsu
    }
  }, block_1 = { id: 'block_1', collection_id: 'collection_1', type: 'collection_view_page', view_ids: ['collection_view_1'] } as any, collection_view_1 = { id: 'collection_view_1', type: 'table', name: "Table" } as any,
  cache = {
    ...NotionCache.createDefaultCache(),
    block: new Map([ [ 'block_1', block_1 ] ]),
    collection: new Map([ [ 'collection_1', collection_1 as any ] ]),
    collection_view: new Map([['collection_view_1', collection_view_1]])
  } as any,
  initializeCacheForSpecificDataMock = jest
    .spyOn(NotionCache, 'initializeCacheForSpecificData')
    .mockImplementation(async () => undefined),
  executeOperationsMock = jest
    .spyOn(NotionOperations, 'executeOperations')
    .mockImplementation(async () => undefined);
  const collection_block = new NotionCore.Api.CollectionBlock({
    ...default_nishan_arg,
		cache,
	});

  return {collection_view_1, block_1, collection_block, collection_1, cache, executeOperationsMock, initializeCacheForSpecificDataMock};
}

it(`getCollection`, async () => {
	const {collection_block, collection_1} = construct()
	const collection = await collection_block.getCollection();
	expect(collection.getCachedData()).toStrictEqual(collection_1);
});

it(`createViews`, async () => {
  const view_id = v4();
  const {collection_block, block_1, executeOperationsMock} = construct();
	const createViews_params: TViewCreateInput[] = [
		{
      id: view_id,
			type: 'table',
			name: 'Table',
			schema_units: [
				tsu
			]
		}
	];
	
  const view_map = await collection_block.createViews(createViews_params);

	expect(executeOperationsMock.mock.calls[0][0].slice(1)).toStrictEqual(
		[
      o.b.s('block_1', ['view_ids'], [ 'collection_view_1', view_id ]),
      o.b.u('block_1', [], last_edited_props)
    ]
  );
  expect(block_1.view_ids).toStrictEqual(['collection_view_1', view_id]);
  expect(view_map.table.get("Table")).toStrictEqual(expect.objectContaining({id: view_id}))
});

it(`getViews`, async () => {
  const {initializeCacheForSpecificDataMock, collection_block} = construct();

	const view_map = await collection_block.getViews(()=>true);
	expect(view_map.table.get("Table")?.id).toStrictEqual('collection_view_1');
	expect(view_map.table.get('collection_view_1')?.id).toStrictEqual('collection_view_1');
  expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual(["block_1", 'block']);
});

it(`updateView`, async () => {
  const {collection_block, initializeCacheForSpecificDataMock, executeOperationsMock} = construct();

	const view_map = await collection_block.updateView(['collection_view_1', {type: "board"}]);

  expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual(["block_1", 'block']);
	expect(view_map.table.get("Table")?.getCachedData()).toStrictEqual(expect.objectContaining({type: "board"}));
	expect(view_map.table.get("collection_view_1")?.getCachedData()).toStrictEqual(expect.objectContaining({type: "board"}));
  expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
    o.cv.u('collection_view_1', [], expect.objectContaining({type: 'board'})),
    o.b.u('block_1', [], last_edited_props),
  ])
});

it(`deleteView`, async () => {
  const {block_1, collection_block, collection_view_1, initializeCacheForSpecificDataMock, executeOperationsMock} = construct();

	const deleted_view_map = await collection_block.deleteView('collection_view_1');

  expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual(["block_1", 'block']);
	expect(collection_view_1).toStrictEqual(expect.objectContaining({alive: false}));
  expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
    o.cv.u('collection_view_1', [], expect.objectContaining({alive: false})),
    o.b.lr('block_1', ['view_ids'], {id: 'collection_view_1'}),
    o.b.u('block_1', [], last_edited_props),
  ]);
  expect(deleted_view_map.table.get('collection_view_1')!.getCachedData()).toStrictEqual(collection_view_1)
  expect(block_1.view_ids).toStrictEqual([])
});