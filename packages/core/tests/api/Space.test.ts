import { NotionCache } from '@nishans/cache';
import { NotionEndpoints } from '@nishans/endpoints';
import { NotionLogger } from '@nishans/logger';
import { NotionOperations } from '@nishans/operations';
import { INotionCache } from '@nishans/types';
import { v4 } from 'uuid';
import { NotionCore } from '../../libs';
import { createSpaceIterateData } from '../../libs/utils';
import { default_nishan_arg, last_edited_props, o } from '../utils';

afterEach(() => {
	jest.restoreAllMocks();
});

describe('createSpaceIterateData', () => {
  it(`type=page`, async()=>{
    const cache = {
      block: new Map([
        ['block_1', {type: "page", id: "block_1"}],
        ['block_2', {type: "header", id: "block_1"}]
      ])
    } as any;
    const data = await createSpaceIterateData('block_1', {cache, token: 'token', user_id: 'user_1'});
    expect(data).toStrictEqual({id: "block_1", type: "page"});
  })

  it(`type=collection_view_page,collection in cache`, async()=>{
    const cache = {
      collection: new Map([['collection_1', {id: 'collection_1'}]]),
      block: new Map([['block_1', {type: "collection_view_page", id: "block_1", collection_id: 'collection_1'}]])
    } as any;
    const data = await createSpaceIterateData('block_1', {cache, token: 'token', user_id: 'user_1'});
    expect(data).toStrictEqual({collection: {id: 'collection_1'}, type: "collection_view_page", id: "block_1", collection_id: 'collection_1'})
  })

  it(`data=undefined,type=header`, async ()=>{
    const cache = {
      block: new Map([
        ['block_1', {type: "page", id: "block_1"}],
        ['block_2', {type: "header", id: "block_1"}]
      ])
    } as any;
    const data = await createSpaceIterateData('block_2', {cache, token: 'token', user_id: 'user_1'});
    expect(data).toBeUndefined();
  })
})

it(`getSpaceView`, async () => {
  const methodLoggerMock = jest.spyOn(NotionLogger.method, 'info').mockImplementation(() => undefined as any);

	const cache: INotionCache = {
			...NotionCache.createDefaultCache(),
			space_view: new Map([
				[ 'space_view_2', { alive: true, space_id: 'space_2', id: 'space_view_2' } as any ],
				[ 'space_view_1', { alive: true, space_id: 'space_1', id: 'space_view_1' } as any ]
			]),
		};
	const space = new NotionCore.Api.Space({
    ...default_nishan_arg,
		cache,
		id: 'space_1',
	});

	const space_view = space.getSpaceView();
	expect(methodLoggerMock).toHaveBeenCalledWith('READ space_view space_view_1');
	expect(space_view.getCachedData()).toStrictEqual({
		alive: true,
		space_id: 'space_1',
		id: 'space_view_1'
	});
});

it(`delete`, async () => {
	const cache = NotionCache.createDefaultCache();
  const methodLoggerMock = jest.spyOn(NotionLogger.method, 'info').mockImplementation(() => undefined as any);

	const space = new NotionCore.Api.Space({
    ...default_nishan_arg,
		cache,
		id: 'space_1'
	});

	const enqueueTaskMock = jest.spyOn(NotionEndpoints.Mutations, 'enqueueTask').mockImplementationOnce(() => {
		return {} as any;
	});

	await space.delete();

	expect(methodLoggerMock).toHaveBeenCalledWith('DELETE space space_1');
	expect(enqueueTaskMock).toHaveBeenCalledTimes(1);
	expect(enqueueTaskMock).toHaveBeenCalledWith(
		{
			task: {
				eventName: 'deleteSpace',
				request: {
					spaceId: 'space_1'
				}
			}
		},
		expect.objectContaining({
			token: 'token',
			interval: 0
		})
	);
});

it(`createRootPages`, async () => {
	const block_id = v4();
	const cache: INotionCache = {
			...NotionCache.createDefaultCache(),
			space: new Map([ [ 'space_1', { id: 'space_1' } as any ] ]),
		},
		executeOperationsMock = jest.spyOn(NotionOperations, 'executeOperations').mockImplementation(async()=>undefined);

	const space = new NotionCore.Api.Space({
    ...default_nishan_arg,
		cache,
		id: 'space_1',
    logger: false
	});

	const block_map = await space.createRootPages([
		{
			type: 'page',
			id: block_id,
			properties: {
				title: [ [ 'Page One' ] ]
			},
      contents: []
		}
	]);

  expect(executeOperationsMock).toHaveBeenCalledTimes(1);
  expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
    o.b.u(block_id, [], expect.objectContaining({
      id: block_id,
      parent_id: "space_1",
      parent_table: "space"
    })),
    o.s.la('space_1', ['pages'], {
      id: block_id
    })]);
    
	expect(block_map.page.get('Page One')?.getCachedData()).toStrictEqual(expect.objectContaining({
    id: block_id
  }));
	expect(block_map.page.get(block_id)?.getCachedData()).toStrictEqual(expect.objectContaining({
    id: block_id
  }));
	expect(cache.block.get(block_id)).toStrictEqual(expect.objectContaining({
    id: block_id
  }));
});

it(`getRootPage`, async () => {
	const block_1: any = { type: 'page', id: 'block_1', properties: { title: [ [ 'Block One' ] ] } }, cache: INotionCache = {
			...NotionCache.createDefaultCache(),
			block: new Map([
				[ 'block_1', block_1 ],
			]),
			notion_user: new Map([ [ 'user_root_1', { id: 'user_root_1' } as any ] ]),
			space: new Map([
				[
					'space_1',
					{
						id: 'space_1',
						pages: [ 'block_1' ],
            created_by_id: 'user_root_1',
						permissions: [
							{
								role: 'editor',
								type: 'space_permission',
								user_id: 'user_root_1'
							}
						]
					} as any
				]
			]),
			user_root: new Map([ [ 'user_root_1', { id: 'user_root_1' } as any ] ]),
		},
    initializeCacheForSpecificDataMock = jest.spyOn(NotionCache, 'initializeCacheForSpecificData').mockImplementationOnce(async()=>undefined);

	const space = new NotionCore.Api.Space({
    ...default_nishan_arg,
		cache,
		id: 'space_1',
    logger: false
	});

	const page_map_1 = await space.getRootPage('block_1');

  expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual(['space_1', 'space']);
  expect(page_map_1.page.get('Block One')?.getCachedData()).toStrictEqual(block_1);
});

it(`updateRootPage`, async()=>{
	const cache: INotionCache = {
			...NotionCache.createDefaultCache(),
			user_root: new Map([ [ 'user_root_1', { id: 'user_root_1' } as any ] ]),
			block: new Map([['block_1', {id: 'block_1', type: "page", properties: {title: [['Page One']]}} as any]]),
			space: new Map([ [ 'space_1', { id: 'space_1', pages: ['block_1'], permissions: [], created_by_id: 'user_root_1', } as any ] ]),
		},
		executeOperationsMock = jest.spyOn(NotionOperations, 'executeOperations').mockImplementation(async()=>undefined),
    initializeCacheForSpecificDataMock = jest.spyOn(NotionCache, 'initializeCacheForSpecificData').mockImplementationOnce(async()=>undefined);

	const space = new NotionCore.Api.Space({
    ...default_nishan_arg,
		cache,
		id: 'space_1',
    logger: false
	});
  const update_arg: any = {
    properties: {
      title: [ [ 'Page Two' ] ]
    }
  }

	const block_map = await space.updateRootPage(['block_1',
		{
			...update_arg,
      type: "page"
		}
	]);
  
  expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual(['space_1', 'space']);
	expect(block_map.page.get('Page One')?.getCachedData()).toStrictEqual(expect.objectContaining({id: 'block_1', ...update_arg}));
	expect(block_map.page.get('block_1')?.getCachedData()).toStrictEqual(expect.objectContaining({id: 'block_1', ...update_arg}));
	expect(cache.block.get('block_1')).toStrictEqual(expect.objectContaining({id: 'block_1', ...update_arg}));
  expect(executeOperationsMock).toHaveBeenCalledTimes(1);
})

it(`deleteRootPage`, async()=>{
	const block_1: any = {id: 'block_1', type: "page", properties: {title: [['Page One']]}}, cache: INotionCache = {
			...NotionCache.createDefaultCache(),
			user_root: new Map([ [ 'user_root_1', { id: 'user_root_1' } as any ] ]),
			block: new Map([['block_1', block_1 as any]]),
			space: new Map([ [ 'space_1', { id: 'space_1', pages: ['block_1'], permissions: [], created_by_id: 'user_root_1', } as any ] ]),
		},
		executeOperationsMock = jest.spyOn(NotionOperations, 'executeOperations').mockImplementation(async()=>undefined),
    initializeCacheForSpecificDataMock = jest.spyOn(NotionCache, 'initializeCacheForSpecificData').mockImplementationOnce(async()=>undefined);

	const space = new NotionCore.Api.Space({
    ...default_nishan_arg,
		cache,
		id: 'space_1',
    logger: false
	});

	const root_page_map = await space.deleteRootPage('block_1');

  expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual(['space_1', 'space']);
  expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
    o.b.u('block_1', [], {
      alive: false,
      ...last_edited_props
    }),
    o.s.lr('space_1', ['pages'], {
      id: 'block_1'
    }),
    o.s.u('space_1', [], last_edited_props)
  ]);
	expect(cache.block.get('block_1')?.alive).toBe(false);
	expect(cache.space.get('space_1')).toStrictEqual(expect.objectContaining({
    pages: []
  }));
  expect(root_page_map.page.get('block_1')!.getCachedData()).toStrictEqual(block_1)
});
