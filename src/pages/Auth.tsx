import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Activity, Mail, Lock, User } from 'lucide-react'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

export function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()
  const reducedMotion = useReducedMotion()

  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (reducedMotion) return

    gsap.from(logoRef.current, {
      y: -30,
      opacity: 0,
      scale: 0.8,
      duration: 0.8,
      ease: 'power3.out',
    })

    gsap.from(cardRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      delay: 0.25,
      ease: 'power3.out',
    })
  }, { scope: containerRef })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        if (!fullName.trim()) {
          throw new Error('El nombre completo es requerido')
        }
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
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-[#020808] via-[#04100e] to-[#061210]"
    >
      {/* Aurora drift bands */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-[0.08] animate-[aurora-drift_8s_ease-in-out_infinite]"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(13,148,136,0.4) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute -top-1/3 -right-1/3 w-[180%] h-[180%] opacity-[0.06] animate-[aurora-drift-2_6s_ease-in-out_infinite]"
          style={{
            background:
              'radial-gradient(ellipse at 70% 40%, rgba(6,182,212,0.35) 0%, transparent 55%)',
          }}
        />
        <div
          className="absolute -bottom-1/2 left-1/4 w-[150%] h-[150%] opacity-[0.05] animate-[aurora-drift_8s_ease-in-out_infinite]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 70%, rgba(13,148,136,0.3) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Twinkling star dots */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[12%] left-[18%] w-1 h-1 rounded-full bg-teal-300/40 animate-[star-twinkle_3s_ease-in-out_infinite_0s]" />
        <div className="absolute top-[8%] right-[22%] w-0.5 h-0.5 rounded-full bg-cyan-200/30 animate-[star-twinkle_4s_ease-in-out_infinite_1.2s]" />
        <div className="absolute top-[25%] left-[65%] w-1 h-1 rounded-full bg-teal-200/35 animate-[star-twinkle_3.5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-[45%] left-[8%] w-0.5 h-0.5 rounded-full bg-white/20 animate-[star-twinkle_5s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-[30%] right-[12%] w-1 h-1 rounded-full bg-teal-300/30 animate-[star-twinkle_4s_ease-in-out_infinite_0.8s]" />
        <div className="absolute bottom-[15%] left-[35%] w-0.5 h-0.5 rounded-full bg-cyan-300/25 animate-[star-twinkle_3s_ease-in-out_infinite_1.5s]" />
        <div className="absolute top-[60%] right-[40%] w-1 h-1 rounded-full bg-teal-200/25 animate-[star-twinkle_4.5s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[8%] right-[55%] w-0.5 h-0.5 rounded-full bg-cyan-200/30 animate-[star-twinkle_3.8s_ease-in-out_infinite_1.8s]" />
      </div>

      {/* Pulse glow behind card */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.1] animate-[pulse-glow_6s_ease-in-out_infinite]"
        style={{
          background:
            'radial-gradient(circle, rgba(13,148,136,0.4) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo section */}
        <div ref={logoRef} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-teal-500 to-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary/30">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            NutriTrack Pro
          </h1>
          <p className="text-dark-muted">Control avanzado de nutrición</p>
        </div>

        {/* Form card */}
        <div
          ref={cardRef}
          className="relative bg-[#0a1210]/80 backdrop-blur-xl border border-primary/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/50"
        >
          {/* Inner top-edge highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent rounded-full" />

          {/* Tab buttons */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-lg shadow-primary/20'
                  : 'bg-dark-hover/50 text-dark-muted hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-lg shadow-primary/20'
                  : 'bg-dark-hover/50 text-dark-muted hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#060e0c]/70 border border-primary/[0.08] rounded-xl focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 text-white transition-all placeholder:text-white/20"
                    placeholder="Juan Pérez"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#060e0c]/70 border border-primary/[0.08] rounded-xl focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 text-white transition-all placeholder:text-white/20"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#060e0c]/70 border border-primary/[0.08] rounded-xl focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 text-white transition-all placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
