import { NotionCache } from '@nishans/cache';
import { NotionOperations } from '@nishans/operations';
import { INotionCache } from '@nishans/types';
import { v4 } from 'uuid';
import { NotionCore } from '../../../libs';
import { default_nishan_arg, last_edited_props, o } from '../../utils';

afterEach(() => {
	jest.restoreAllMocks();
});

const construct = () => {
	const space_1 = {
			id: 'space_1'
		},
		discussion_1 = { id: 'discussion_1', comments: [ 'comment_1' ] } as any,
		comment_1: any = { id: 'comment_1' },
		block_1 = {
			id: 'block_1',
			parent_table: 'space',
			parent_id: 'space_1',
			type: 'page',
			content: [ 'block_2', 'block_3' ]
		},
		block_2 = {
			discussions: [ 'discussion_1' ],
			id: 'block_2',
			type: 'header',
			properties: { title: [ [ 'Header' ] ] }
		} as any,
		block_3 = {
			id: 'block_3',
			type: 'embed',
			properties: { title: [ [ 'Embed' ] ] }
		} as any,
		cache = {
			...NotionCache.createDefaultCache(),
			block: new Map([ [ 'block_3', block_3 ], [ 'block_1', block_1 ], [ 'block_2', block_2 ] ]),
			space: new Map([ [ 'space_1', space_1 ] ]),
			discussion: new Map([ [ 'discussion_1', discussion_1 ] ]),
			comment: new Map([ [ 'comment_1', comment_1 ] ])
		} as any,
		executeOperationsMock = jest.spyOn(NotionOperations, 'executeOperations').mockImplementation(async () => undefined),
		initializeCacheForSpecificDataMock = jest
			.spyOn(NotionCache, 'initializeCacheForSpecificData')
			.mockImplementationOnce(async () => undefined);

	const page = new NotionCore.Api.Page({
		...default_nishan_arg,
		cache,
		logger: false
	});
	return {
		block_3,
		space_1,
		comment_1,
		discussion_1,
		cache,
		block_1,
		block_2,
		page,
		initializeCacheForSpecificDataMock,
		executeOperationsMock
	};
};

it(`getCachedParentData`, async () => {
	const { space_1, page } = construct();
	const space = await page.getCachedParentData();
	expect(space).toStrictEqual(space_1);
});

it(`createBlocks`, async () => {
	const { page, cache } = construct();
	const id = v4();
	const block_map = await page.createBlocks([
		{
			id,
			type: 'header',
			properties: {
				title: [ [ 'Header' ] ]
			}
		}
	]);
	expect(block_map.header.get('Header')).not.toBeUndefined();
	expect(block_map.header.get(id)).not.toBeUndefined();
	expect(cache.block.get(id)).not.toBeUndefined();
});

it(`getBlock`, async () => {
	const { page, initializeCacheForSpecificDataMock } = construct();

	const block_map = await page.getBlock('block_2');

	expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual([ 'block_1', 'block' ]);
	expect(block_map.header.get('block_2')).not.toBeUndefined();
	expect(block_map.header.get('Header')).not.toBeUndefined();
});

it(`updateBlock`, async () => {
	const { block_2, page, executeOperationsMock, initializeCacheForSpecificDataMock } = construct();

	const block_map = await page.updateBlock([ 'block_2', { alive: false } as any ]);

	expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual([ 'block_1', 'block' ]);
	expect(block_map.header.get('block_2')).not.toBeUndefined();
	expect(block_2.alive).toBe(false);
	expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
		o.b.u(
			'block_2',
			[],
			expect.objectContaining({
				alive: false
			})
		),
		o.b.u('block_1', [], last_edited_props)
	]);
});

it(`deleteBlock`, async () => {
	const { block_2, page, executeOperationsMock, initializeCacheForSpecificDataMock } = construct();

	const deleted_block_map = await page.deleteBlock('block_2');

	expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual([ 'block_1', 'block' ]);
	expect(block_2.alive).toBe(false);
	expect(executeOperationsMock).toHaveBeenCalledTimes(1);
	expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
		o.b.u(
			'block_2',
			[],
			expect.objectContaining({
				alive: false
			})
		),
		o.b.lr('block_1', [ 'content' ], {
			id: 'block_2'
		}),
		o.b.u('block_1', [], last_edited_props)
	]);
	expect(deleted_block_map.header.get('block_2')!.getCachedData()).toStrictEqual(block_2);
});

it(`updateBookmarkedStatus`, async () => {
	const space_view_1 = { space_id: 'space_1', id: 'space_view_1', bookmarked_pages: [ 'block_1' ] },
		cache: INotionCache = {
			...NotionCache.createDefaultCache(),
			block: new Map([ [ 'block_1', { id: 'block_1', type: 'page', space_id: 'space_1' } as any ] ]),
			space_view: new Map([
				[ 'space_view_2', { id: 'space_view_2', space_id: 'space_2' } ],
				[ 'space_view_1', space_view_1 as any ]
			])
		},
		executeOperationsMock = jest.spyOn(NotionOperations, 'executeOperations').mockImplementation(async () => undefined);

	const page = new NotionCore.Api.Page({
		...default_nishan_arg,
		cache,
		logger: false
	});

	await page.updateBookmarkedStatus(false);

	expect(executeOperationsMock).toHaveBeenCalledTimes(1);
});

it(`getDiscussion`, async () => {
	const { discussion_1, page, initializeCacheForSpecificDataMock } = construct();

	const discussion = await page.getDiscussion('discussion_1');

	expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual([ 'block_1', 'block' ]);
	expect(discussion.getCachedData()).toBe(discussion_1);
});

it(`getComment`, async () => {
	const { comment_1, page, initializeCacheForSpecificDataMock } = construct();

	const comment = await page.getComment('comment_1');

	expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual([ 'block_1', 'block' ]);
	expect(comment.getCachedData()).toBe(comment_1);
});
