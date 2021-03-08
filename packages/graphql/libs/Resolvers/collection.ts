import { INotionCacheOptions, NotionCache } from '@nishans/cache';
import { ICollection, IPage } from '@nishans/types';
import { NotionUtils } from '@nishans/utils';

let initialized_cache = false;

export const NotionGraphqlCollectionResolver = {
	name: (parent: ICollection) => NotionUtils.extractInlineBlockContent(parent.name),
	parent: async ({ parent_id }: ICollection, _: any, ctx: INotionCacheOptions) =>
		await NotionCache.fetchDataOrReturnCached('block', parent_id, ctx),
	templates: async ({ id, template_pages }: ICollection, _: any, ctx: INotionCacheOptions) => {
		if (!initialized_cache) {
			await NotionCache.initializeCacheForSpecificData(id, 'collection', ctx);
			initialized_cache = true;
		}
		return template_pages ? template_pages.map((template_page) => ctx.cache.block.get(template_page)) : [];
	},
	rows: async ({ id }: ICollection, _: any, ctx: INotionCacheOptions) => {
		if (!initialized_cache) {
			await NotionCache.initializeCacheForSpecificData(id, 'collection', ctx);
			initialized_cache = true;
		}
		const pages: IPage[] = [];
		for (const [ , page ] of ctx.cache.block)
			if (page.type === 'page' && page.parent_table === 'collection' && page.parent_id === id && !page.is_template)
				pages.push(page);
		return pages;
	}
};