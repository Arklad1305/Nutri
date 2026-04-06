import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { Analysis } from './pages/Analysis'
import { Profile } from './pages/Profile'
import { HealthChat } from './pages/HealthChat'
import { Recipes } from './pages/Recipes'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-dark-muted">Cargando...</div>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/auth" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-dark-muted">Cargando...</div>
      </div>
    )
  }

  return !user ? <>{children}</> : <Navigate to="/" />
}

function AppRoutes() {
  return (
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
  )
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
