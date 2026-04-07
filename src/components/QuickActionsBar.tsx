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
        className="group relative w-13 h-13 rounded-2xl bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/20 shadow-[0_4px_20px_-4px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(6,182,212,0.1)] hover:bg-cyan-500/15 hover:border-cyan-400/30 hover:shadow-[0_8px_30px_-4px_rgba(6,182,212,0.35)] transition-all duration-300 flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95"
        title="Agregar 250ml de agua"
      >
        <Droplets className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
        <span className="absolute -left-[4.5rem] bg-[#0a1a1a]/90 backdrop-blur-xl border border-cyan-500/15 rounded-xl px-3 py-1.5 text-[10px] font-semibold text-cyan-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-lg shadow-black/30">
          +250ml agua
        </span>
      </button>

      {/* Add food primary */}
      <button
        onClick={onOpenAddFood}
        className="group relative w-13 h-13 rounded-2xl bg-primary/12 backdrop-blur-xl border border-primary/20 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.3),inset_0_1px_0_rgba(13,148,136,0.1)] hover:bg-primary/18 hover:border-primary/30 hover:shadow-[0_8px_30px_-4px_rgba(13,148,136,0.4)] transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
        title="Agregar alimento"
      >
        <Plus className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(13,148,136,0.4)]" />
        <span className="absolute -left-[5.5rem] bg-[#0a1a1a]/90 backdrop-blur-xl border border-primary/15 rounded-xl px-3 py-1.5 text-[10px] font-semibold text-teal-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-lg shadow-black/30">
          Agregar comida
        </span>
      </button>

      {/* Camera / photo food recognition */}
      <button
        onClick={handleCameraClick}
        disabled={cameraState === 'processing'}
        className={`group relative w-13 h-13 rounded-2xl backdrop-blur-xl border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 disabled:hover:scale-100 ${
          cameraState === 'processing'
            ? 'bg-primary/10 border-primary/20 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.2)] animate-pulse'
            : cameraState === 'success'
            ? 'bg-emerald-500/12 border-emerald-400/25 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.3)]'
            : cameraState === 'error'
            ? 'bg-red-500/10 border-red-400/20 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.2)]'
            : 'bg-white/[0.04] border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)]'
        }`}
        title="Foto de alimento"
      >
        {cameraState === 'processing' ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : cameraState === 'success' ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
        ) : (
          <Camera className="w-5 h-5 text-white/60 drop-shadow-[0_0_4px_rgba(255,255,255,0.1)]" />
        )}
        <span className={`absolute -left-[6.5rem] bg-[#0a1a1a]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl px-3 py-1.5 text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-lg shadow-black/30 ${
          cameraState === 'error' ? 'text-red-400 border-red-500/15' : cameraState === 'success' ? 'text-emerald-400 border-emerald-500/15' : 'text-white/70'
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
