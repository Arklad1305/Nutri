import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RecipeGenerationProvider } from './contexts/RecipeGenerationContext'
import { Layout } from './components/Layout'

// Lazy-loaded pages — cada una se descarga solo cuando se visita
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })))
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Analysis = lazy(() => import('./pages/Analysis').then(m => ({ default: m.Analysis })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))
const HealthChat = lazy(() => import('./pages/HealthChat').then(m => ({ default: m.HealthChat })))
const Recipes = lazy(() => import('./pages/Recipes').then(m => ({ default: m.Recipes })))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-dark-muted text-sm">Cargando...</span>
      </div>
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />

  return user ? <>{children}</> : <Navigate to="/auth" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />

  return !user ? <>{children}</> : <Navigate to="/" />
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Layout>
                <HealthChat />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <PrivateRoute>
              <Layout>
                <Analysis />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/recipes"
          element={
            <PrivateRoute>
              <Layout>
                <Recipes />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RecipeGenerationProvider>
          <AppRoutes />
        </RecipeGenerationProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
