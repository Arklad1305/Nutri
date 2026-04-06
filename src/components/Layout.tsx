import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, BarChart3, User, MessageCircle, ChefHat } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-dark-card/90 backdrop-blur-xl border-t border-dark-border/50 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-around h-18 py-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1.5 px-5 py-2 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'text-primary scale-105'
                    : 'text-dark-muted hover:text-white hover:scale-105'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl blur-sm" />
                  )}
                  <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary/20 to-orange-500/20 shadow-lg shadow-primary/20'
                      : 'bg-dark-hover/0 group-hover:bg-dark-hover/50'
                  }`}>
                    <Home className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  </div>
                  <span className={`text-[10px] font-bold relative transition-all ${isActive ? 'text-primary' : ''}`}>
                    Dashboard
                  </span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1.5 px-5 py-2 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'text-primary scale-105'
                    : 'text-dark-muted hover:text-white hover:scale-105'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl blur-sm" />
                  )}
                  <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary/20 to-orange-500/20 shadow-lg shadow-primary/20'
                      : 'bg-dark-hover/0 group-hover:bg-dark-hover/50'
                  }`}>
                    <MessageCircle className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  </div>
                  <span className={`text-[10px] font-bold relative transition-all ${isActive ? 'text-primary' : ''}`}>
                    Chat
                  </span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/recipes"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1.5 px-5 py-2 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'text-primary scale-105'
                    : 'text-dark-muted hover:text-white hover:scale-105'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl blur-sm" />
                  )}
                  <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary/20 to-orange-500/20 shadow-lg shadow-primary/20'
                      : 'bg-dark-hover/0 group-hover:bg-dark-hover/50'
                  }`}>
                    <ChefHat className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  </div>
                  <span className={`text-[10px] font-bold relative transition-all ${isActive ? 'text-primary' : ''}`}>
                    Recetas
                  </span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/analysis"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1.5 px-5 py-2 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'text-primary scale-105'
                    : 'text-dark-muted hover:text-white hover:scale-105'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl blur-sm" />
                  )}
                  <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary/20 to-orange-500/20 shadow-lg shadow-primary/20'
                      : 'bg-dark-hover/0 group-hover:bg-dark-hover/50'
                  }`}>
                    <BarChart3 className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  </div>
                  <span className={`text-[10px] font-bold relative transition-all ${isActive ? 'text-primary' : ''}`}>
                    Análisis
                  </span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1.5 px-5 py-2 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'text-primary scale-105'
                    : 'text-dark-muted hover:text-white hover:scale-105'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl blur-sm" />
                  )}
                  <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary/20 to-orange-500/20 shadow-lg shadow-primary/20'
                      : 'bg-dark-hover/0 group-hover:bg-dark-hover/50'
                  }`}>
                    <User className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  </div>
                  <span className={`text-[10px] font-bold relative transition-all ${isActive ? 'text-primary' : ''}`}>
                    Perfil
                  </span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </nav>
    </div>
  )
}
