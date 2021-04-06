import { INotionRepositionParams, NotionLineage } from '@nishans/lineage';
import { NotionLogger } from '@nishans/logger';
import { NotionOperations } from '@nishans/operations';
import { FilterType, FilterTypes, UpdateType, UpdateTypes } from '@nishans/traverser';
import { IOperation, ISpace, ISpaceView, IUserRoot, TPage } from '@nishans/types';
import { INotionCoreOptions, IPageMap, ISpaceViewUpdateInput, NotionCore } from '../';
import { transformToMultiple } from '../utils';
import Data from './Data';
import Space from './Space';

/**
 * A class to represent space view of Notion
 * @noInheritDoc
 */
class SpaceView extends Data<ISpaceView, ISpaceViewUpdateInput> {
	constructor (arg: INotionCoreOptions) {
		super({ ...arg, type: 'space_view' });
	}

	getCachedParentData () {
		return this.cache.user_root.get(this.user_id) as IUserRoot;
	}

	async reposition (arg?: INotionRepositionParams) {
		await NotionOperations.executeOperations(
			[
				NotionLineage.positionChildren<IUserRoot>('space_views', {
					logger: this.logger,
					child_id: this.id,
					position: arg,
					parent: this.getCachedParentData(),
					parent_type: 'user_root'
				})
			],
			this.getProps()
		);
	}

	/**
   * Get the corresponding space associated with this space view
   * @returns The corresponding space object
   */
	getSpace () {
		const data = this.getCachedData();
		let target_space: ISpace = null as any;
		for (const [ , space ] of this.cache.space) {
			if (data && space.id === data.space_id) {
				target_space = space;
				break;
			}
		}
		this.logger && NotionLogger.method.info(`READ space ${target_space.id}`);
		return new Space({
			id: target_space.id,
			...this.getProps()
		});
	}

	async getBookmarkedPage (arg: FilterType<TPage>) {
		return await this.getBookmarkedPages(transformToMultiple(arg), false);
	}

	async getBookmarkedPages (args: FilterTypes<TPage>, multiple?: boolean) {
		return await this.getIterate<TPage, IPageMap>(
			args,
			{
				child_ids: 'bookmarked_pages',
				child_type: 'block',
				multiple,
				container: NotionCore.CreateMaps.page()
			},
			(id) => this.cache.block.get(id) as TPage,
			async (_, page, page_map) => {
				await NotionCore.PopulateMap.page(page, page_map, this.getProps());
			}
		);
	}

	/**
  * Toggle a single page from the bookmark list
  * @param arg id string or a predicate filter function
  */
	async updateBookmarkedPage (arg: UpdateType<TPage, boolean>) {
		return await this.updateBookmarkedPages(transformToMultiple(arg), false);
	}

	/**
   * Toggle multiple pages from the bookmark list
   * @param arg string of ids or a predicate function
   * @param multiple whether multiple or single item is targeted
   */
	async updateBookmarkedPages (args: UpdateTypes<TPage, boolean>, multiple?: boolean) {
		const data = this.getCachedData(),
			operations: IOperation[] = [];
		await this.initializeCacheForThisData();
		const updated_pages = await this.updateIterate<TPage, boolean, IPageMap>(
			args,
			{
				// FEAT:1:E Move to lineage
				child_ids: NotionLineage.getPageIds(this.cache),
				child_type: 'block',
				multiple,
				manual: true,
				initialize_cache: false,
				container: NotionCore.CreateMaps.page()
			},
			(id) => this.cache.block.get(id) as TPage,
			async (id, page, updated_favorite_status, page_map) => {
				operations.push(
					...(await NotionLineage.updateChildContainer<ISpaceView>(
						'space_view',
						data.id,
						updated_favorite_status,
						id,
						'bookmarked_pages',
						this.getProps()
					))
				);
				await NotionCore.PopulateMap.page(page, page_map, this.getProps());
			}
		);
		await NotionOperations.executeOperations(operations, this.getProps());
		return updated_pages;
	}
}

export default SpaceView;
