import { NotionOperations } from '@nishans/operations';
import { default_nishan_arg, o } from '../../../core/tests/utils';
import { NotionDiscourse } from '../../libs';

it(`reopenDiscussions`, async () => {
	const executeOperationsMock = jest
		.spyOn(NotionOperations, 'executeOperations')
		.mockImplementation(async () => undefined);

	await NotionDiscourse.Discussions.reopen([ 'discussion_1' ], default_nishan_arg);
	expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([ o.d.s('discussion_1', [ 'resolved' ], false) ]);
});
