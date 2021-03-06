import { NotionLogger } from '@nishans/logger';
import { ICollection, INotionCache, IPage, TBlock } from '@nishans/types';
import { createExecuteOperationsMock } from '../../../utils/tests';
import { o } from '../../core/tests/utils';
import { NotionTraverser } from '../libs';
import { c1id, c1uo, c2id, c2uo, c3id, cd, constructCache, p1id, p1uo, uc1d, uc2d, up1d, update_props } from './utils';

afterEach(() => {
	jest.restoreAllMocks();
});

it(`manual=false`, async () => {
	const child_ids = [ c1id, c2id, c3id ],
		{ e1 } = createExecuteOperationsMock();
	const cache = constructCache(child_ids);
	const methodLoggerMock = jest.spyOn(NotionLogger.method, 'info').mockImplementation(() => undefined as any);

	const cb_spy = jest.fn();

	const updated_data = await NotionTraverser.update<IPage, TBlock, TBlock>(
		[ [ c1id, { data: c1id } as any ], [ c2id, { data: c2id } as any ] ],
		(id) => cache.block.get(id),
		{
			container: [],
			cache,
			child_ids,
			logger: true,
			...update_props
		},
		(id, data, update_data, container) => {
			cb_spy(id, data, update_data);
			container.push(data);
		}
	);

	expect(methodLoggerMock.mock.calls).toEqual([ [ `UPDATE block ${c1id}` ], [ `UPDATE block ${c2id}` ] ]);
	expect(cb_spy.mock.calls).toEqual([
		[
			c1id,
			uc1d,
			{
				data: c1id
			}
		],
		[
			c2id,
			uc2d,
			{
				data: c2id
			}
		]
	]);
	expect(cache.block.get(p1id)).toStrictEqual(up1d);
	expect(updated_data).toStrictEqual([ uc1d, uc2d ]);
	e1([ c1uo, c2uo, p1uo ]);
});

it(`manual=false,parent_type&child_type!=block`, async () => {
	const child_ids = [ c1id ],
		{ e1 } = createExecuteOperationsMock();
	const cache = {
		collection: new Map([
			[
				p1id,
				{
					id: p1id,
					content: child_ids
				}
			],
			cd(c1id)
		])
	} as INotionCache;

	await NotionTraverser.update<IPage, ICollection, ICollection>(
		[ [ c1id, { data: c1id } as any ] ],
		(id) => cache.collection.get(id),
		{
			container: [],
			cache,
			child_ids,
			...update_props,
			child_type: 'collection',
			parent_type: 'collection'
		}
	);

	expect(cache.collection.get(p1id)).toStrictEqual({
		id: p1id,
		content: child_ids
	});
	e1([
		o.c.u(c1id, [], {
			data: c1id
		})
	]);
});

it(`manual=true`, async () => {
	const child_ids = [ c1id, c2id, c3id ],
		{ e1 } = createExecuteOperationsMock();
	const cache = constructCache(child_ids);

	const updated_data = await NotionTraverser.update<IPage, TBlock, TBlock>(
		[ [ c1id, { data: c1id } as any ], [ c2id, { data: c2id } as any ] ],
		(id) => cache.block.get(id),
		{
			container: [],
			cache,
			child_ids: 'content',
			manual: true,
			...update_props
		},
		(_, data, __, container) => {
			data.alive = false;
			container.push(data);
		}
	);

	expect(cache.block.get(p1id)).toStrictEqual(up1d);

	expect(updated_data).toStrictEqual([
		{
			id: c1id,
			alive: false
		},
		{
			id: c2id,
			alive: false
		}
	]);

	e1([ p1uo ]);
});
