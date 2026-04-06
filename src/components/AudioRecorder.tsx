import { useState, useRef } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AudioRecorderProps {
  onAnalysisComplete: (result: any) => void
  onError: (error: string) => void
}

export function AudioRecorder({ onAnalysisComplete, onError }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      onError('Necesitamos permiso para usar tu micrófono')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)

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
              audioBase64: base64String,
              mimeType: 'audio/webm'
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
            onError(result.error || 'Error al procesar el audio')
          }
        } catch (error) {
          console.error('Error in onloadend:', error)
          onError(error instanceof Error ? error.message : 'Error al procesar el audio')
        } finally {
          setIsProcessing(false)
        }
      }

      reader.onerror = () => {
        onError('Error al leer el archivo de audio')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      onError(error instanceof Error ? error.message : 'Error al analizar el audio')
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        isRecording
          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
          : 'text-dark-muted hover:text-white hover:bg-dark-hover'
      }`}
      title={isRecording ? 'Detener grabación' : 'Grabar audio'}
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isRecording ? (
        <Square className="w-4 h-4 text-white" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  )
}
