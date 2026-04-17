import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, BarChart3, User, MessageCircle, ChefHat } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/recipes', icon: ChefHat, label: 'Recetas' },
  { to: '/analysis', icon: BarChart3, label: 'Análisis' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-dark-card/95 backdrop-blur-md border-t border-dark-border z-50">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex items-center justify-around h-14">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-dark-muted hover:text-dark-text'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
