import { NotionCache } from '@nishans/cache';
import { createExecuteOperationsMock } from '../../../../utils/tests';
import {
  default_nishan_arg,
  last_edited_props,
  o
} from '../../../core/tests/utils';
import { NotionDiscourse } from '../../libs';

afterEach(() => {
  jest.restoreAllMocks();
});

it(`NotionDiscourse.updateComments`, async () => {
  const comment_data: any = { id: 'comment_1' },
    cache = {
      ...NotionCache.createDefaultCache(),
      discussion: new Map([
        ['discussion_1', { comments: ['comment_1'] } as any]
      ]),
      comment: new Map([['comment_1', comment_data]])
    },
    options = {
      ...default_nishan_arg,
      cache_init_tracker: {
        ...NotionCache.createDefaultCacheInitializeTracker(),
        discussion: new Map([['discussion_1', true]])
      },
      cache
    } as any,
    initializeCacheForSpecificDataMock = jest
      .spyOn(NotionCache, 'initializeCacheForSpecificData')
      .mockImplementation(async () => undefined),
    { e1 } = createExecuteOperationsMock();

  await NotionDiscourse.Comments.update(
    'discussion_1',
    [
      [
        'comment_1',
        {
          text: [['New Comment']]
        }
      ]
    ],
    options
  );
  e1([
    o.cm.u('comment_1', [], { ...last_edited_props, text: [['New Comment']] })
  ]);
  expect(initializeCacheForSpecificDataMock.mock.calls[0].slice(0, 2)).toEqual([
    'discussion_1',
    'discussion'
  ]);
  expect(comment_data.text).toStrictEqual([['New Comment']]);
});
