import { useRef, useState } from 'react'
import { Plus, Droplets, Camera, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface QuickActionsBarProps {
  onWaterAdded?: () => void
  onOpenAddFood?: () => void
  onFoodAdded?: () => void
}

export function QuickActionsBar({ onWaterAdded, onOpenAddFood, onFoodAdded }: QuickActionsBarProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [cameraState, setCameraState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [cameraError, setCameraError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addWaterQuick = async () => {
    if (!user) return
    setLoading(true)
    try {
      await supabase.from('water_logs').insert({
        user_id: user.id,
        amount_ml: 250,
      })
      onWaterAdded?.()
    } catch (error) {
      console.error('Error adding water:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setCameraState('error')
      setCameraError('Selecciona una imagen válida')
      setTimeout(() => setCameraState('idle'), 3000)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setCameraState('error')
      setCameraError('Imagen muy grande (máx 10MB)')
      setTimeout(() => setCameraState('idle'), 3000)
      return
    }

    setCameraState('processing')
    setCameraError('')

    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = (reader.result as string).split(',')[1]
          resolve(result)
        }
        reader.onerror = () => reject(new Error('Error al leer imagen'))
        reader.readAsDataURL(file)
      })

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sesión expirada')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-food-ai`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: file.type,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error del servidor: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setCameraState('success')
        onFoodAdded?.()
        setTimeout(() => setCameraState('idle'), 2000)
      } else {
        throw new Error(result.error || 'Error al procesar la imagen')
      }
    } catch (error) {
      console.error('Error processing camera image:', error)
      setCameraState('error')
      setCameraError(error instanceof Error ? error.message : 'Error al analizar')
      setTimeout(() => setCameraState('idle'), 3000)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="fixed bottom-24 right-4 md:right-8 flex flex-col gap-3 z-40">
      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Water quick add */}
      <button
        onClick={addWaterQuick}
        disabled={loading}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 flex items-center justify-center disabled:opacity-50 hover:scale-110 active:scale-95"
        title="Agregar 250ml de agua"
      >
        <Droplets className="w-6 h-6 text-white" />
        <span className="absolute -left-16 bg-dark-card/90 backdrop-blur-sm border border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          +250ml agua
        </span>
      </button>

      {/* Add food primary */}
      <button
        onClick={onOpenAddFood}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
        title="Agregar alimento"
      >
        <Plus className="w-6 h-6 text-white" />
        <span className="absolute -left-20 bg-dark-card/90 backdrop-blur-sm border border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Agregar comida
        </span>
      </button>

      {/* Camera / photo food recognition */}
      <button
        onClick={handleCameraClick}
        disabled={cameraState === 'processing'}
        className={`group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 disabled:hover:scale-100 ${
          cameraState === 'processing'
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/50 animate-pulse'
            : cameraState === 'success'
            ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/50'
            : cameraState === 'error'
            ? 'bg-gradient-to-br from-red-500 to-rose-500 shadow-red-500/50'
            : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/50 hover:shadow-purple-500/70'
        }`}
        title="Foto de alimento"
      >
        {cameraState === 'processing' ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : cameraState === 'success' ? (
          <CheckCircle className="w-6 h-6 text-white" />
        ) : (
          <Camera className="w-6 h-6 text-white" />
        )}
        <span className={`absolute -left-28 bg-dark-card/90 backdrop-blur-sm border border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
          cameraState === 'error' ? 'text-red-400' : cameraState === 'success' ? 'text-green-400' : 'text-white'
        }`}>
          {cameraState === 'processing'
            ? 'Analizando foto...'
            : cameraState === 'success'
            ? 'Alimento registrado!'
            : cameraState === 'error'
            ? cameraError
            : 'Foto de comida'}
        </span>
      </button>
    </div>
  )
}
