import { NotionIdz } from '../../libs';

it('Should output correctly for uuidToId function', () => {
	expect(NotionIdz.Transform.toId('dd721d8b-bf35-4036-bdcd-e9378e8b7e83')).toBe('dd721d8bbf354036bdcde9378e8b7e83');
});
