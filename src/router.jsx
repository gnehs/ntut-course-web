import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Layout } from './components/Layout.jsx'
import { AboutPage, ChangelogPage, DocPage, NotFoundPage, PrivacyPage, SettingsPage, StatusPage } from './routes/StaticPages.jsx'
import { AddCalendarPage } from './routes/AddCalendarPage.jsx'
import { AdvancedSearchPage } from './routes/AdvancedSearchPage.jsx'
import { CalendarPage } from './routes/CalendarPage.jsx'
import { ClassDetailPage, ClassIndexPage } from './routes/ClassPages.jsx'
import { CourseDetailPage } from './routes/CourseDetailPage.jsx'
import { EmptyRoomPage } from './routes/EmptyRoomPage.jsx'
import { HomePage } from './routes/HomePage.jsx'
import { MProgramDetailPage, MProgramIndexPage } from './routes/MProgramPage.jsx'
import { MyCoursePage } from './routes/MyCoursePage.jsx'
import { SearchPage } from './routes/SearchPage.jsx'
import { StandardPage } from './routes/StandardPage.jsx'
import { TeacherPage } from './routes/TeacherPage.jsx'
import { WidgetPage } from './routes/WidgetPage.jsx'
import { WithdrawalPage } from './routes/WithdrawalPage.jsx'

const rootRoute = createRootRoute({ component: Layout })

function route(path, component) {
  return createRoute({ getParentRoute: () => rootRoute, path, component })
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
])

export const router = createRouter({ routeTree })
