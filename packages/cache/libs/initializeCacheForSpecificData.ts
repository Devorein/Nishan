import { NotionEndpoints, UpdateCacheManuallyParam } from '@nishans/endpoints';
import {
	ICollection,
	IComment,
	IDiscussion,
	ISpace,
	ISpaceView,
	IUserRoot,
	TBlock,
	TCollectionBlock,
	TDataType,
	TView
} from '@nishans/types';
import { INotionCacheOptions, NotionCache } from './';

/**
 * Initialize cache for specific type of data
 * @param id The id of the data
 * @param type The type of data
 */
export async function initializeCacheForSpecificData (id: string, type: TDataType, options: INotionCacheOptions) {
	const should_initialize_cache = options.cache_init_tracker[type] && options.cache_init_tracker[type].get(id) !== true;
	if (should_initialize_cache) {
		const { cache } = options;
		const container: UpdateCacheManuallyParam = [],
			extra_container: UpdateCacheManuallyParam = [];
		switch (type) {
			case 'block': {
				const data = (await NotionCache.fetchDataOrReturnCached('block', id, options)) as TBlock;
				if (data.type.match(/^(page|collection_view_page|collection_view)$/)) {
					let has_more_chunk = true,
						next_index = 0;
					while (has_more_chunk) {
						const { recordMap, cursor } = await NotionEndpoints.Queries.loadPageChunk(
							{
								pageId: id,
								limit: 100,
								cursor: {
									stack: [
										[
											{
												table: 'block',
												id: id,
												index: next_index
											}
										]
									]
								},
								chunkNumber: 1,
								verticalColumns: false
							},
							options
						);
						NotionCache.saveToCache(recordMap, cache);
						has_more_chunk = cursor.stack.length !== 0;
						if (has_more_chunk) next_index = cursor.stack[0][0].index;
					}

					if (data.type !== 'collection_view') {
						const { recordMap } = await NotionEndpoints.Queries.getActivityLog(
							{
								limit: 100,
								spaceId: data.space_id,
								navigableBlockId: data.id
							},
							options
						);
						NotionCache.saveToCache(recordMap, cache);
					}
				}

				NotionCache.extractNotionUserIds(data).forEach((notion_user_id) =>
					container.push([ notion_user_id, 'notion_user' ])
				);
				NotionCache.extractSpaceAndParentId(data).forEach((sync_record_value) => container.push(sync_record_value));
				break;
			}
			case 'space': {
				// If the type is space, fetch its pages and notion_user
				const data = (await NotionCache.fetchDataOrReturnCached('space', id, options)) as ISpace;
				data.pages.forEach((id) => container.push([ id, 'block' ]));
				NotionCache.extractNotionUserIds(data).forEach((notion_user_id) =>
					container.push([ notion_user_id, 'notion_user' ])
				);
				break;
			}
			case 'discussion': {
				const data = (await NotionCache.fetchDataOrReturnCached('discussion', id, options)) as IDiscussion;
				data.comments.forEach((id) => container.push([ id, 'comment' ]));
				container.push([ data.parent_id, 'block' ]);
				break;
			}
			case 'user_root': {
				// If the type is user_root, fetch its space_view
				const data = (await NotionCache.fetchDataOrReturnCached('user_root', id, options)) as IUserRoot;
				data.space_views.map((space_view) => container.push([ space_view, 'space_view' ]));
				break;
			}
			case 'collection': {
				// If the type is collection, fetch its template_pages and all of its row_pages
				const data = (await NotionCache.fetchDataOrReturnCached('collection', id, options)) as ICollection;
				if (data.template_pages) data.template_pages.forEach((id) => container.push([ id, 'block' ]));
				// Fetching the row_pages of collection
				const { recordMap } = await NotionEndpoints.Queries.queryCollection(
					{
						collectionId: id,
						collectionViewId: '',
						query: {},
						loader: {
							type: 'table',
							loadContentCover: false,
							limit: 5000,
							userTimeZone: 'UTC'
						}
					},
					options
				);
				NotionCache.saveToCache(recordMap, cache);
				container.push([ data.parent_id, 'block' ]);
				break;
			}
			case 'collection_view': {
				const data = cache[type].get(id) as TView;
				container.push([ data.parent_id, 'block' ]);
				break;
			}
			case 'space_view': {
				const data = (await NotionCache.fetchDataOrReturnCached('space_view', id, options)) as ISpaceView;
				if (data.bookmarked_pages) data.bookmarked_pages.forEach((id) => container.push([ id, 'block' ]));
				container.push([ data.space_id, 'space' ]);
				container.push([ data.parent_id, 'user_root' ]);
				break;
			}
			case 'comment': {
				const data = (await NotionCache.fetchDataOrReturnCached('comment', id, options)) as IComment;
				NotionCache.extractNotionUserIds(data).forEach((id) => container.push([ id, 'notion_user' ]));
				container.push([ data.space_id, 'space' ]);
				container.push([ data.parent_id, data.parent_table ]);
				break;
			}
		}

		// Filters data that doesn't exist in the cache
		await NotionCache.updateCacheIfNotPresent(container, options);

		if (type === 'collection_view') {
			const data = cache[type].get(id) as TView,
				parent = cache.block.get(data.parent_id) as TCollectionBlock;
			extra_container.push([ parent.collection_id, 'collection' ]);
		}
		await NotionCache.updateCacheIfNotPresent(extra_container, options);
		options.cache_init_tracker[type].set(id, true);
	}
}
