import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Layout } from './components/Layout';
import {
	AboutPage,
	ChangelogPage,
	DocPage,
	NotFoundPage,
	PrivacyPage,
	SettingsPage,
	StatusPage,
} from './routes/StaticPages';
import { AddCalendarPage } from './routes/AddCalendarPage';
import { AdvancedSearchPage } from './routes/AdvancedSearchPage';
import { CalendarPage } from './routes/CalendarPage';
import { ClassDetailPage, ClassIndexPage } from './routes/ClassPages';
import { CourseDetailPage } from './routes/CourseDetailPage';
import { EmptyRoomPage } from './routes/EmptyRoomPage';
import { HomePage } from './routes/HomePage';
import { MProgramDetailPage, MProgramIndexPage } from './routes/MProgramPage';
import { MyCoursePage } from './routes/MyCoursePage';
import { SearchPage } from './routes/SearchPage';
import { StandardPage } from './routes/StandardPage';
import { TeacherPage } from './routes/TeacherPage';
import { WidgetPage } from './routes/WidgetPage';
import { WithdrawalPage } from './routes/WithdrawalPage';

const rootRoute = createRootRoute({ component: Layout });

function route(path, component) {
	return createRoute({ getParentRoute: () => rootRoute, path, component });
}

const routeTree = rootRoute.addChildren([
	route('/', HomePage),
	route('/advanced-search', AdvancedSearchPage),
	route('/search', SearchPage),
	route('/course/$year/$sem/$id', CourseDetailPage),
	route('/class', ClassIndexPage),
	route('/class/$year/$sem/$id', ClassDetailPage),
	route('/mprogram', MProgramIndexPage),
	route('/mprogram/$year/$sem/$id', MProgramDetailPage),
	route('/my-course', MyCoursePage),
	route('/emptyroom', EmptyRoomPage),
	route('/withdrawal', WithdrawalPage),
	route('/calendar', CalendarPage),
	route('/standard', StandardPage),
	route('/widget', WidgetPage),
	route('/add-calendar', AddCalendarPage),
	route('/teacher/$id', TeacherPage),
	route('/doc', DocPage),
	route('/about', AboutPage),
	route('/privacy', PrivacyPage),
	route('/status', StatusPage),
	route('/settings', SettingsPage),
	route('/changelog', ChangelogPage),
	route('/not-found', NotFoundPage),
]);

export function createAppRouter(options = {}) {
	return createRouter({ routeTree, ...options });
}

export const router = createAppRouter();
