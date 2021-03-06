import { NotionCache } from '@nishans/cache';
import { Schema } from '@nishans/types';
import { v4 } from 'uuid';
import { default_nishan_arg, o } from '../../../core/tests/utils';
import { NotionFabricator } from '../../libs';
import { tsu } from '../utils';

afterEach(() => {
  jest.restoreAllMocks();
});

const default_collection = {
  id: 'collection_id',
  schema: {
    title: tsu
  } as Schema,
  parent_id: 'parent_id'
};

describe('Output correctly', () => {
  it(`Should work correctly`, async () => {
    const id = v4(),
      filter: any = {
        operator: 'string_is',
        value: {
          type: 'exact',
          value: '123'
        }
      },
      cb = jest.fn();

    const expected_view_data = {
      id,
      version: 0,
      type: 'table',
      name: 'Table',
      page_sort: [],
      parent_id: 'parent_id',
      parent_table: 'block',
      alive: true,
      format: {
        table_properties: [
          {
            property: 'title',
            visible: true,
            width: 250
          }
        ],
        table_wrap: false,
        inline_collection_first_load_limit: {
          type: 'load_all'
        }
      },
      query2: {
        aggregations: [],
        sort: [],
        filter: {
          operator: 'and',
          filters: [
            {
              property: 'title',
              filter
            }
          ]
        }
      },
      space_id: 'space_1'
    };

    const [views_data, operations] = await NotionFabricator.CreateData.views(
      default_collection,
      [
        {
          id,
          type: 'table',
          name: 'Table',
          schema_units: [tsu],
          filters: [
            {
              ...tsu,
              filter
            }
          ]
        }
      ],
      default_nishan_arg,
      'parent_id',
      cb
    );
    expect(operations).toStrictEqual([
      o.cv.u(views_data[0].id, [], expected_view_data)
    ]);
    expect(views_data).toStrictEqual([expected_view_data]);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ id }));
  });
});

describe('throws error', () => {
  it(`empty input values`, async () => {
    await expect(
      NotionFabricator.CreateData.views(
        default_collection,
        [],
        {
          ...default_nishan_arg,
          cache: NotionCache.createDefaultCache()
        },
        'parent_id'
      )
    ).rejects.toThrow(`input views array cannot be empty`);
  });
});
