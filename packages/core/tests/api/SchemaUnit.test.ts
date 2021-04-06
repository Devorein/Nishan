import { NotionCache } from '@nishans/cache';
import { NotionLogger } from '@nishans/logger';
import { NotionOperations } from '@nishans/operations';
import { INotionCache } from '@nishans/types';
import colors from "colors";
import { tsu, txsu } from '../../../fabricator/tests/utils';
import { NotionCore } from '../../libs';
import { default_nishan_arg, o } from '../utils';

afterEach(() => {
	jest.restoreAllMocks();
});

it(`update`, async () => {
  const cache: INotionCache = {
    ...NotionCache.createDefaultCache(),
    collection: new Map([
      [
        'collection_1',
        {
          schema: {
            schema_id_1: txsu
          }
        }
      ] as any
    ]),
  };

  const methodLoggerMock = jest.spyOn(NotionLogger.method, 'info').mockImplementation(() => undefined as any);

  const schema_unit = new NotionCore.Api.SchemaUnit({
    ...default_nishan_arg,
    cache,
    id: 'collection_1',
    schema_id: 'schema_id_1',
    logger: true
  }), executeOperationsMock = jest.spyOn(NotionOperations, 'executeOperations').mockImplementation(async()=>undefined);

  const update_arg: any = {
    type: 'text',
    name: 'New Name'
  }
  await schema_unit.update(update_arg);

  expect(methodLoggerMock).toHaveBeenCalledTimes(1);
  expect(methodLoggerMock).toHaveBeenCalledWith("UPDATE collection collection_1");

  expect(cache.collection.get('collection_1')?.schema).toStrictEqual({
    schema_id_1: update_arg
  });

  expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
    o.c.u('collection_1', [], {
      schema: {
        schema_id_1: update_arg
      }
    })
  ])
});

describe('delete', () => {
  it(`type=text`, async () => {
    const cache: INotionCache = {
      ...NotionCache.createDefaultCache(),
      collection: new Map([
        [
          'collection_1',
          {
            schema: {
              schema_id_1: txsu,
              schema_id_2: tsu
            }
          }
        ] as any
      ]),
    },
      executeOperationsMock = jest.spyOn(NotionOperations, 'executeOperations').mockImplementation(async()=>undefined);

    const methodLoggerMock = jest.spyOn(NotionLogger.method, 'info').mockImplementation(() => undefined as any);
    const schema_unit = new NotionCore.Api.SchemaUnit({
      ...default_nishan_arg,
      cache,
      id: 'collection_1',
      schema_id: 'schema_id_1',
    });

    const deleted_schema_unit = await schema_unit.delete();

    expect(methodLoggerMock).toHaveBeenCalledTimes(1);
    expect(methodLoggerMock).toHaveBeenCalledWith("DELETE collection collection_1");
    expect(cache.collection.get('collection_1')!.schema).toStrictEqual({
      schema_id_2: tsu
    });
    expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
      o.c.u('collection_1', [], {
        schema: {
          schema_id_2: tsu
        }
      }),
    ]);
    expect(deleted_schema_unit.getCachedChildData()).toStrictEqual(undefined);
  });

  it(`type=title`, async () => {
    const cache: INotionCache = {
      ...NotionCache.createDefaultCache(),
      collection: new Map([
        [
          'collection_1',
          {
            schema: {
              schema_id_1: tsu
            }
          }
        ] as any
      ]),
    };

    const schema_unit = new NotionCore.Api.SchemaUnit({
      ...default_nishan_arg,
      cache,
      id: 'collection_1',
      schema_id: 'schema_id_1',
    });

    await expect(()=>schema_unit.delete()).rejects.toThrow(colors.red.bold(`Title schema unit cannot be deleted`));
  });
})

describe('duplicate', () => {
  it(`type=text`, async () => {
    const collection_1: any = {
      schema: {
        text: txsu
      }
    }, cache: INotionCache = {
      ...NotionCache.createDefaultCache(),
      collection: new Map([
        [
          'collection_1',
          collection_1
        ] as any
      ]),
    },
      executeOperationsMock = jest.spyOn(NotionOperations, 'executeOperations').mockImplementation(async()=>undefined);
    const methodLoggerMock = jest.spyOn(NotionLogger.method, 'info').mockImplementation(() => undefined as any);

    const schema_unit = new NotionCore.Api.SchemaUnit({
      ...default_nishan_arg,
      cache,
      id: 'collection_1',
      schema_id: 'text',
    });

    const duplicated_schema_unit = await schema_unit.duplicate();

    expect(Object.keys(collection_1.schema).length).toBe(2);
    expect(methodLoggerMock).toHaveBeenCalledTimes(1);
    expect(methodLoggerMock).toHaveBeenCalledWith("UPDATE collection collection_1");
    expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
      o.c.u('collection_1', [], {schema: expect.objectContaining({
        text: txsu
      })})
    ]);
    expect(duplicated_schema_unit.getCachedChildData()).toStrictEqual(txsu);
  });

  it(`type=title`, async () => {
    const collection_1: any = {
      schema: {
        schema_id_1: tsu
      }
    }, cache: INotionCache = {
      ...NotionCache.createDefaultCache(),
      collection: new Map([
        [
          'collection_1',
          collection_1
        ] as any
      ]),
    };

    const schema_unit = new NotionCore.Api.SchemaUnit({
      ...default_nishan_arg,
      cache,
      id: 'collection_1',
      schema_id: 'schema_id_1',
    });

    await expect(()=>schema_unit.duplicate()).rejects.toThrow(colors.red.bold(`Title schema unit cannot be duplicated`));
  });
})

it(`getCachedChildData`, () => {
  const collection_1: any = {
    schema: {
      schema_id_1: tsu
    }
  }, cache: INotionCache = {
    ...NotionCache.createDefaultCache(),
    collection: new Map([
      [
        'collection_1',
        collection_1
      ] as any
    ]),
  };

  const schema_unit = new NotionCore.Api.SchemaUnit({
    ...default_nishan_arg,
    cache,
    id: 'collection_1',
    schema_id: 'schema_id_1',
  });

  expect(schema_unit.getCachedChildData()).toStrictEqual({
    type: 'title',
    name: 'Title'
  });
})