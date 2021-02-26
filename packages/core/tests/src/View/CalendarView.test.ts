import { CalendarView } from '../../../';
import { default_nishan_arg } from '../../utils/defaultNishanArg';

afterEach(() => {
	jest.restoreAllMocks();
});

it(`CalendarView`, () => {
	new CalendarView(default_nishan_arg);
});
