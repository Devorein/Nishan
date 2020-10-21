import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import fs from "fs";
import path from "path";

import Block from './Block';
import CollectionViewPage from './CollectionViewPage';
import CollectionView from './CollectionView';

import createViews from "../utils/createViews";

import { collectionUpdate, lastEditOperations, blockUpdate, blockSet, blockListAfter, spaceViewListBefore, spaceViewListRemove } from '../utils/chunk';

import { error } from "../utils/logs";

import { TPage, Schema, SchemaUnitType, NishanArg, ExportType, Permission, TPermissionRole, } from "../types/types";
import { CreateBlockArg, UserViewArg } from "../types/function";
import { ISpaceView } from "../types/api";
import { PageFormat, PageProps, IRootPage, IFactoryInput, TBlockInput, WebBookmarkProps, IPage, ICollectionView, ICollectionViewPage, TBlock } from "../types/block";

class Page extends Block<TPage> {
  block_data: TPage;

  constructor(arg: NishanArg & { block_data: TPage }) {
    super(arg);
    if (arg.block_data.type !== 'page') throw new Error(error(`Cannot create page block from ${arg.block_data.type} block`));
    this.block_data = arg.block_data;
  }

  async getBlocks() {
    const { block } = await this.loadPageChunk({
      chunkNumber: 0,
      cursor: { stack: [] },
      limit: 50,
      pageId: this.block_data.id,
      verticalColumns: false
    });

    const blocks: Block<TBlock>[] = [];
    if (this.block_data.content) {
      this.block_data.content.forEach(content_id => {
        const block_data = block[content_id].value;
        if (block_data) blocks.push(block_data.type === "page" ? new Page({
          block_data,
          ...this.getProps()
        }) : new Block({
          block_data,
          ...this.getProps()
        }))
      })
      return blocks;
    } else
      throw new Error(error("This page doesnot have any content"));
  }

  // ? FEAT:1:H Add updated value to cache and internal class state
  /**
   * Update the properties and the format of the page
   * @param opts The format and properties of the page to update
   */
  async update(opts: { format: Partial<PageFormat>, properties: Partial<PageProps>, permissions: Permission[] }) {
    const { format = this.block_data.format, properties = this.block_data.properties, permissions = (this.block_data as IRootPage).permissions } = opts;
    await this.saveTransactions([
      blockUpdate(this.block_data.id, ['format'], format),
      blockUpdate(this.block_data.id, ['properties'], properties),
      blockUpdate(this.block_data.id, ['permissions'], permissions),
      blockSet(this.block_data.id, ['last_edited_time'], Date.now())
    ])
  }

  /**
   * Add/remove this page from the favourite list
   */
  async toggleFavourite() {
    await this.loadUserContent();
    let target_space_view: ISpaceView | null = null;
    for (let [, space_view] of this.cache.space_view) {
      if (space_view.space_id === this.block_data.space_id) {
        target_space_view = space_view;
        break;
      }
    };
    if (target_space_view) {
      const is_bookmarked = target_space_view.bookmarked_pages && target_space_view.bookmarked_pages.includes(this.block_data.id);
      await this.saveTransactions([
        (is_bookmarked ? spaceViewListRemove : spaceViewListBefore)(target_space_view.id, ["bookmarked_pages"], { id: this.block_data.id })
      ])
    }
  }

  /**
   * Add a page as a linked page to current page
   * @param $block_id Id of the page to add as a linked page
   */
  async createLinkedPageContent($block_id: string) {
    const parent_id = this.block_data.id;
    await this.saveTransactions([
      blockListAfter(parent_id, ['content'], { after: '', id: $block_id }),
      ...lastEditOperations(parent_id, this.user_id)
    ]);
  }

  // ? FEAT:1:M Add mention a person/page/date content
  async createMentionBlockContent() {

  }

  // ? FEAT:1:E Add inline equation content
  async createInlineEquationContent() {

  }

  /**
   * Export the page and its content as a zip
   * @param arg Options used for setting up export
   */
  // ? FEAT:2:M Add export block method (maybe create a separate class for it as CollectionViewPage will also support it)
  async export(arg: { dir: string, timeZone: string, recursive: boolean, exportType: ExportType }) {
    const { dir = "output", timeZone, recursive = true, exportType = "markdown" } = arg || {};
    const { taskId } = await this.enqueueTask({
      eventName: 'exportBlock',
      request: {
        blockId: this.block_data.id,
        exportOptions: {
          exportType,
          locale: "en",
          timeZone
        },
        recursive
      }
    });

    const { results } = await this.getTasks([taskId]);

    const response = await axios.get(results[0].status.exportURL, {
      responseType: 'arraybuffer'
    });

    const fullpath = path.resolve(process.cwd(), dir, 'export.zip');

    fs.createWriteStream(fullpath).end(response.data);
  }

  async createTemplateContent(factory: IFactoryInput) {
    const { format, properties, type } = factory;
    const $block_id = uuidv4();
    const content_blocks = (factory.contents.map(content => ({ ...content, $block_id: uuidv4() })) as CreateBlockArg[]).map(content => {
      const obj = this.createBlock(content);
      obj.args.parent_id = $block_id;
      return obj;
    });
    const content_block_ids = content_blocks.map(content_block => content_block.id);

    await this.saveTransactions(
      [
        this.createBlock({
          $block_id,
          type,
          properties,
          format
        }),
        ...content_block_ids.map(content_block_id => blockListAfter($block_id, ['content'], { after: '', id: content_block_id })),
        blockListAfter(this.block_data.id, ['content'], { after: '', id: $block_id }),
        ...content_blocks
      ]
    );

    const recordMap = await this.loadPageChunk({
      chunkNumber: 0,
      cursor: { stack: [] },
      limit: 100,
      pageId: this.block_data.id,
      verticalColumns: false
    });

    return {
      template: new Block({
        block_data: recordMap.block[$block_id].value,
        ...this.getProps()
      }),
      contents: content_block_ids.map(content_block_id => new Block({
        block_data: recordMap.block[content_block_id].value,
        ...this.getProps()
      }))
    }
  }
  /**
   * Create contents for a page except **linked Database** and **Collection view** block
   * @param {ContentOptions} options Options for modifying the content during creation
   */
  // ? TD:1:H Format and properties based on IBlockType
  async createContent(options: TBlockInput) {
    // ? FEAT:1:M User given after id as position
    // ? FEAT:2:H Return specific class instances based on content type
    const { format, properties, type } = options;

    const $block_id = uuidv4();
    await this.saveTransactions(
      [
        this.createBlock({
          $block_id,
          type,
          properties,
          format,
        }),
        blockListAfter(this.block_data.id, ['content'], { after: '', id: $block_id }),
      ]
    );

    if (type === "bookmark")
      await this.setBookmarkMetadata({
        blockId: $block_id,
        url: (properties as WebBookmarkProps).link[0][0]
      })

    const recordMap = await this.loadPageChunk({
      chunkNumber: 0,
      cursor: { stack: [] },
      limit: 100,
      pageId: this.block_data.id,
      verticalColumns: false
    });

    if (type === 'page') return new Page({
      block_data: recordMap.block[$block_id].value as IPage,
      ...this.getProps()
    });
    else return new Block({
      block_data: recordMap.block[$block_id].value,
      ...this.getProps()
    });
  }

  async createLinkedDBContent(collection_id: string, views: UserViewArg[] = []) {
    const $content_id = uuidv4();
    const $views = views.map((view) => ({ ...view, id: uuidv4() }));
    const view_ids = $views.map((view) => view.id);
    const current_time = Date.now();
    await this.saveTransactions(
      [
        ...createViews($views, $content_id),
        blockSet($content_id, [], {
          id: $content_id,
          version: 1,
          type: 'collection_view',
          collection_id,
          view_ids,
          parent_id: this.block_data.id,
          parent_table: 'block',
          alive: true,
          created_by_table: 'notion_user',
          created_by_id: this.user_id,
          created_time: current_time,
          last_edited_by_table: 'notion_user',
          last_edited_by_id: this.user_id,
          last_edited_time: current_time
        }),
        blockListAfter(this.block_data.id, ['content'], { after: '', id: $content_id }),
        blockSet($content_id, ['last_edited_time'], current_time)
      ]
    );

    const { recordMap } = await this.queryCollection({
      collectionId: collection_id, collectionViewId: view_ids[0], query: {},
      loader: {
        limit: 100,
        searchQuery: '',
        type: 'table'
      }
    });

    return new CollectionView({
      ...this.getProps(),
      parent_id: this.block_data.id,
      block_data: recordMap.block[$content_id].value as ICollectionView
    });
  }

  async createFullPageDBContent(options: { views?: UserViewArg[], schema?: ([string, SchemaUnitType] | [string, SchemaUnitType, Record<string, any>])[] } = {}) {
    if (!options.views) options.views = [{ aggregations: [['title', 'count']], name: 'Default View', type: 'table' }];
    if (!options.schema) options.schema = [['Name', 'title']];
    const views = (options.views && options.views.map((view) => ({ ...view, id: uuidv4() }))) || [];
    const view_ids = views.map((view) => view.id);
    const $collection_id = uuidv4();
    const current_time = Date.now();
    const schema: Schema = {};
    if (options.schema)
      options.schema.forEach(opt => {
        const schema_key = (opt[1] === "title" ? "Title" : opt[0]).toLowerCase().replace(/\s/g, '_');
        schema[schema_key] = { name: opt[0], type: opt[1], ...(opt[2] ?? {}) };
        if (schema[schema_key].options) schema[schema_key].options = (schema[schema_key] as any).options.map(([value, color]: [string, string]) => ({ id: uuidv4(), value, color }))
      });

    await this.saveTransactions(
      [
        blockUpdate(this.block_data.id, [], {
          id: this.block_data.id,
          type: 'collection_view_page',
          collection_id: $collection_id,
          view_ids,
          properties: {},
          created_time: current_time,
          last_edited_time: current_time
        }),
        collectionUpdate($collection_id, [], {
          id: $collection_id,
          schema,
          format: {
            collection_page_properties: []
          },
          icon: (this.block_data as IPage).format.page_icon,
          parent_id: this.block_data.id,
          parent_table: 'block',
          alive: true,
          name: (this.block_data as IPage).properties.title
        }),
        ...createViews(views, this.block_data.id)
      ]
    );

    const { recordMap } = await this.queryCollection({
      collectionId: $collection_id, collectionViewId: view_ids[0], query: {},
      loader: {
        limit: 100,
        searchQuery: '',
        type: 'table'
      }
    });

    return new CollectionViewPage({
      ...this.getProps(),
      // ? RF: Why would you need parent id if `collection_view_page[this.block_data.id]` already has that
      parent_id: this.block_data.id,
      block_data: recordMap.block[this.block_data.id].value as ICollectionViewPage
    })
  }

  async createInlineDBContent(options: { views?: UserViewArg[] } = {}) {
    // ? FEAT:1:M Task in schema
    const $collection_view_id = uuidv4();
    const $collection_id = uuidv4();
    const views = (options.views && options.views.map((view) => ({ ...view, id: uuidv4() }))) || [];
    const view_ids = views.map((view) => view.id);
    const parent_id = this.block_data.id;
    await this.saveTransactions(
      [
        this.createBlock({ $block_id: $collection_view_id, properties: {}, format: {}, type: 'collection_view' }),
        ...createViews(views, this.block_data.id),
        collectionUpdate($collection_id, [], {
          id: $collection_id,
          schema: {
            title: { name: 'Name', type: 'title' }
          },
          format: {
            collection_page_properties: []
          },
          parent_id: $collection_view_id,
          parent_table: 'block',
          alive: true
        }),
        blockListAfter(parent_id, ['content'], { after: '', id: $collection_view_id }),
      ]
    );

    const { recordMap } = await this.queryCollection({
      collectionId: $collection_id, collectionViewId: view_ids[0], query: {},
      loader: {
        limit: 100,
        searchQuery: '',
        type: 'table'
      }
    });

    return new CollectionView({
      ...this.getProps(),
      parent_id: this.block_data.id,
      block_data: recordMap.block[$collection_view_id].value as ICollectionView
    })
  }

  async addUsers(args: [string, TPermissionRole][]) {
    const permissionItems: Permission[] = [];
    for (let i = 0; i < args.length; i++) {
      const [email, permission] = args[i];
      const notion_user = await this.findUser(email);
      if (!notion_user) throw new Error(error(`User does not have a notion account`));
      else
        permissionItems.push({
          role: permission,
          type: "user_permission",
          user_id: notion_user.id
        });
    }
    await this.inviteGuestsToSpace({
      blockId: this.block_data.id,
      permissionItems,
      spaceId: this.space_id
    })
  }
}

export default Page;