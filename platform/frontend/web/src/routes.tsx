import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ProposalsPage from './pages/ProposalsPage';
import ResultsPage from './pages/ResultsPage';
import ProposalDetailPage from './pages/ProposalDetailPage';
import ProfilePage from './pages/ProfilePage';
import ModerationDashboardPage from './pages/ModerationDashboardPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/proposals" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <WelcomePage /> },
      {
        path: 'login',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute>
            <RegistrationPage />
          </PublicRoute>
        ),
      },
      {
        path: 'proposals',
        element: (
          <PrivateRoute>
            <ProposalsPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'proposals/:id',
        element: (
          <PrivateRoute>
            <ProposalDetailPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'results',
        element: (
          <PrivateRoute>
            <ResultsPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        ),
      },
      {
        path: 'moderation',
        element: (
          <PrivateRoute>
            <ModerationDashboardPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <PrivateRoute>
            <AnalyticsDashboardPage />
          </PrivateRoute>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
