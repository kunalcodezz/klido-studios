import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const WebsiteEntryPage = lazy(() => import('./pages/dashboard/WebsiteEntryPage'));
const BuilderPage = lazy(() => import('./pages/dashboard/BuilderPage'));
const PagesListPage = lazy(() => import('./pages/dashboard/PagesListPage'));
const PageDetailsPage = lazy(() => import('./pages/dashboard/PageDetailsPage'));
const RevisionsPage = lazy(() => import('./pages/dashboard/RevisionsPage'));
const SectionsLibraryPage = lazy(() => import('./pages/dashboard/SectionsLibraryPage'));
const PreviewPage = lazy(() => import('./pages/preview/PreviewPage'));
const ServicesManagerPage = lazy(() => import('./pages/dashboard/ServicesManagerPage'));
const ProjectsManagerPage = lazy(() => import('./pages/dashboard/ProjectsManagerPage'));
const BrandsManagerPage = lazy(() => import('./pages/dashboard/BrandsManagerPage'));
const TestimonialsManagerPage = lazy(() => import('./pages/dashboard/TestimonialsManagerPage'));
const MediaLibraryPage = lazy(() => import('./pages/dashboard/MediaLibraryPage'));
const DesignSystemPage = lazy(() => import('./pages/dashboard/DesignSystemPage'));
const NavigationManagerPage = lazy(() => import('./pages/dashboard/NavigationManagerPage'));
const SeoManagerPage = lazy(() => import('./pages/dashboard/SeoManagerPage'));
const WebsiteSettingsPage = lazy(() => import('./pages/dashboard/WebsiteSettingsPage'));
const UsersPage = lazy(() => import('./pages/dashboard/UsersPage'));
const ActivityLogPage = lazy(() => import('./pages/dashboard/ActivityLogPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/preview/:pageId" element={<PreviewPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard/builder/:pageId" element={<BuilderPage />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="website" element={<WebsiteEntryPage />} />
                  <Route path="pages" element={<PagesListPage />} />
                  <Route path="pages/:pageId" element={<PageDetailsPage />} />
                  <Route path="sections" element={<SectionsLibraryPage />} />
                  <Route path="services" element={<ServicesManagerPage />} />
                  <Route path="projects" element={<ProjectsManagerPage />} />
                  <Route path="brands" element={<BrandsManagerPage />} />
                  <Route path="testimonials" element={<TestimonialsManagerPage />} />
                  <Route path="media" element={<MediaLibraryPage />} />
                  <Route path="design-system" element={<DesignSystemPage />} />
                  <Route path="navigation" element={<NavigationManagerPage />} />
                  <Route path="seo" element={<SeoManagerPage />} />
                  <Route path="revisions" element={<RevisionsPage />} />
                  <Route path="settings" element={<WebsiteSettingsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="activity" element={<ActivityLogPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
