import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Activity, Mail, Lock, User } from 'lucide-react'

export function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        if (!fullName.trim()) throw new Error('El nombre completo es requerido')
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark-text">NutriTrack</h1>
          <p className="text-sm text-dark-muted mt-1">Control de nutrición</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <div className="flex gap-1 mb-6 bg-dark-hover rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                isLogin ? 'bg-primary text-white' : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                !isLogin ? 'bg-primary text-white' : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-dark-muted mb-1.5">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary/50 text-dark-text text-sm placeholder:text-dark-muted"
                    placeholder="Juan Pérez" required={!isLogin} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-dark-muted mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary/50 text-dark-text text-sm placeholder:text-dark-muted"
                  placeholder="tu@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-muted mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary/50 text-dark-text text-sm placeholder:text-dark-muted"
                  placeholder="••••••••" required minLength={6} />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
