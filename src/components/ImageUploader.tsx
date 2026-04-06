import { useRef, useState } from 'react'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ImageUploaderProps {
  onAnalysisComplete: (result: any) => void
  onError: (error: string) => void
}

export function ImageUploader({ onAnalysisComplete, onError }: ImageUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onError('Por favor selecciona una imagen válida')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('La imagen es muy grande. Máximo 10MB')
      return
    }

    await processImage(file)
  }

  const processImage = async (file: File) => {
    setIsProcessing(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1]

          const { data: { session }, error: sessionError } = await supabase.auth.getSession()

          if (sessionError) {
            onError('Error al obtener sesión: ' + sessionError.message)
            return
          }

          if (!session?.access_token) {
            onError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
            return
          }

          const now = Math.floor(Date.now() / 1000)
          if (session.expires_at && session.expires_at < now) {
            onError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
            return
          }

          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-food-ai`

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              imageBase64: base64String,
              mimeType: file.type
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Error del servidor: ${response.status}`)
          }

          const result = await response.json()

          if (result.success) {
            onAnalysisComplete(result)
          } else {
            onError(result.error || 'Error al procesar la imagen')
          }
        } catch (error) {
          console.error('Error in onloadend:', error)
          onError(error instanceof Error ? error.message : 'Error al procesar la imagen')
        } finally {
          setIsProcessing(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }

      reader.onerror = () => {
        onError('Error al leer la imagen')
        setIsProcessing(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      console.error('Error processing image:', error)
      onError(error instanceof Error ? error.message : 'Error al analizar la imagen')
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleImageClick}
        disabled={isProcessing}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-dark-muted hover:text-white transition-colors rounded-lg hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
        title="Subir imagen de alimentos"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ImageIcon className="w-5 h-5" />
        )}
      </button>
    </>
  )
}
