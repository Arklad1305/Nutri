import { useState, useEffect, useRef } from 'react'
import { saveUserMessage, saveAssistantMessage, loadChatHistory, sendMessageToAI } from '../lib/chatService'
import { supabase } from '../lib/supabase'
import { Send, Bot, User as UserIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CompactFoodCard } from '../components/CompactFoodCard'
import { AudioRecorder } from '../components/AudioRecorder'
import { ImageUploader } from '../components/ImageUploader'
import { ProcessingSteps } from '../components/ProcessingSteps'

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  data?: any
  isTyping?: boolean
  processingType?: 'text' | 'audio' | 'image'
}

export function HealthChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [processingMessage, setProcessingMessage] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const welcomeMessage: Message = {
          id: '0',
          content: 'Hola, soy tu asistente nutricional con IA. Puedo ayudarte a analizar alimentos, calcular macros y responder tus dudas sobre nutrición.\n\nMostrando conversaciones de hoy.\n\n¿Qué te gustaría saber?',
          sender: 'assistant',
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
        return
      }

      const result = await loadChatHistory(user.id, 50)

      if (result.success && result.messages && result.messages.length > 0) {
        const loadedMessages: Message[] = result.messages.map(msg => {
          return {
            id: msg.id.toString(),
            content: msg.content,
            sender: msg.sender as 'user' | 'assistant',
            timestamp: new Date(msg.created_at),
            data: msg.metadata,
          }
        })
        setMessages(loadedMessages)
      } else {
        const welcomeMessage: Message = {
          id: '0',
          content: 'Hola, soy tu asistente nutricional con IA. Puedo ayudarte a analizar alimentos, calcular macros y responder tus dudas sobre nutrición.\n\nMostrando conversaciones de hoy.\n\n¿Qué te gustaría saber?',
          sender: 'assistant',
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error('[HealthChat] Error loading history:', error)
      const welcomeMessage: Message = {
        id: '0',
        content: 'Hola, soy tu asistente nutricional con IA. Puedo ayudarte a analizar alimentos, calcular macros y responder tus dudas sobre nutrición.\n\nMostrando conversaciones de hoy.\n\n¿Qué te gustaría saber?',
        sender: 'assistant',
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const messageContent = inputMessage

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Mensaje temporal de procesamiento
    const tempTypingMessage: Message = {
      id: 'typing-' + Date.now(),
      content: 'Analizando tu consulta...',
      sender: 'assistant',
      timestamp: new Date(),
      isTyping: true,
      processingType: 'text',
    }
    setMessages(prev => [...prev, tempTypingMessage])
    setProcessingMessage('Procesando con IA...')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await saveUserMessage(user.id, messageContent)
      }

      const response = await sendMessageToAI(messageContent)

      // Remover mensaje temporal
      setMessages(prev => prev.filter(msg => !msg.isTyping))

      if (response.success && response.data) {
        const replyText = response.data.reply || 'Respuesta recibida'

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: replyText,
          sender: 'assistant',
          timestamp: new Date(),
          data: response.data.food,
        }

        setMessages(prev => [...prev, assistantMessage])

        if (user) {
          await saveAssistantMessage(user.id, replyText, response.data.food)
        }
      } else {
        // Remover mensaje temporal
        setMessages(prev => prev.filter(msg => !msg.isTyping))

        console.error('API Error:', response.error, response.details)

        let errorText = response.error || 'Lo siento, hubo un error al procesar tu mensaje.'

        if (response.error?.includes('GEMINI_API_KEY')) {
          errorText = 'El API key de Gemini no está configurado. Contacta al administrador.'
        } else if (response.error?.includes('Unauthorized') || response.error?.includes('Authentication')) {
          errorText = 'Tu sesión expiró. Por favor, cierra sesión y vuelve a iniciar.'
        } else if (response.details) {
          errorText += `\n\nDetalles: ${response.details}`
        }

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: errorText,
          sender: 'assistant',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      // Remover mensaje temporal
      setMessages(prev => prev.filter(msg => !msg.isTyping))

      console.error('Unexpected error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}\n\nPor favor, verifica tu conexión e intenta nuevamente.`,
        sender: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setProcessingMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleMultimediaAnalysis = async (result: any, type: 'audio' | 'image') => {
    setIsLoading(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      content: type === 'audio' ? 'Audio enviado para análisis' : 'Imagen enviada para análisis',
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    // Mensaje temporal de procesamiento
    const tempTypingMessage: Message = {
      id: 'typing-' + Date.now(),
      content: type === 'audio' ? 'Transcribiendo y analizando tu audio...' : 'Analizando la imagen...',
      sender: 'assistant',
      timestamp: new Date(),
      isTyping: true,
      processingType: type,
    }
    setMessages(prev => [...prev, tempTypingMessage])
    setProcessingMessage(type === 'audio' ? 'Procesando audio con IA...' : 'Identificando alimentos en la imagen...')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await saveUserMessage(user.id, userMessage.content)
      }



      // Remover mensaje temporal
      setMessages(prev => prev.filter(msg => !msg.isTyping))

      if (result.success && result.data) {
        const replyText = result.data.reply_text || `${result.data.food_name || 'Alimento'} registrado correctamente`

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: replyText,
          sender: 'assistant',
          timestamp: new Date(),
          data: result.data,
        }

        setMessages(prev => [...prev, assistantMessage])

        if (user) {
          await saveAssistantMessage(user.id, replyText, result.data)
        }
      } else {
        throw new Error(result.error || 'Error al procesar el contenido')
      }
    } catch (error) {
      // Remover mensaje temporal
      setMessages(prev => prev.filter(msg => !msg.isTyping))

      console.error('Error processing multimedia:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error al procesar ${type === 'audio' ? 'el audio' : 'la imagen'}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        sender: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setProcessingMessage('')
    }
  }

  const handleMultimediaError = (error: string) => {
    const errorMessage: Message = {
      id: Date.now().toString(),
      content: error,
      sender: 'assistant',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, errorMessage])
  }

  const renderMessageContent = (message: Message) => {
    // Si es un mensaje de "escribiendo" con pasos de procesamiento
    if (message.isTyping && message.processingType) {
      return <ProcessingSteps type={message.processingType} />
    }

    const hasNutritionData = message.data && typeof message.data === 'object' &&
      (message.data.name || message.data.food_name || message.data.calories || message.data.macros || message.data.micros)

    if (hasNutritionData) {
      return (
        <div>
          <p className="whitespace-pre-wrap">{message.content}</p>
          <CompactFoodCard data={message.data} />
        </div>
      )
    }

    return <p className="whitespace-pre-wrap">{message.content}</p>
  }

  return (
    <div className="flex flex-col h-screen bg-dark-bg">
      {/* ── Premium Header ── */}
      <div className="sticky top-0 z-10 bg-[#080c14]/95 backdrop-blur-xl border-b border-primary/10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-8 left-1/4 w-40 h-24 bg-primary/6 rounded-full blur-3xl" />
          <div className="absolute -top-4 right-1/4 w-32 h-20 bg-cyan-500/5 rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-teal-600/10 border border-primary/25 flex items-center justify-center shadow-[0_0_14px_rgba(13,148,136,0.2)]">
              <Bot className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-base font-black text-white tracking-tight">Asistente Nutricional</h1>
              <p className="text-xs text-dark-muted">
                {isLoading && processingMessage ? (
                  <span className="text-primary-400 animate-pulse">{processingMessage}</span>
                ) : (
                  <>
                    <span className="text-primary-300">{format(new Date(), "d 'de' MMMM", { locale: es })}</span>
                    <span className="text-dark-muted/40 mx-1.5">·</span>
                    <span>Conversaciones de hoy</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-dark-bg overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer-sweep_2s_ease-in-out_infinite]" />
          </div>
        )}
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto pb-24 mobile-scroll-hide scroll-smooth-mobile">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary-600 shadow-md shadow-primary/25'
                      : 'bg-dark-card/80 border border-dark-border/50 shadow-md shadow-black/20'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <UserIcon className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-primary-400" />
                  )}
                </div>

                <div className={`flex-1 ${message.isTyping ? 'max-w-[90%]' : 'max-w-[80%]'} ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary-600 text-white rounded-tr-md shadow-lg shadow-primary/20'
                        : message.isTyping
                        ? 'bg-dark-card/60 backdrop-blur-sm border border-primary/20 text-white rounded-tl-md shadow-lg shadow-primary/10'
                        : 'bg-dark-card/50 backdrop-blur-sm border border-dark-border/40 text-white rounded-tl-md shadow-lg shadow-black/15'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {renderMessageContent(message)}
                    </div>
                  </div>
                  <p className={`text-[10px] text-dark-muted/60 mt-1.5 px-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {format(message.timestamp, 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div className="fixed bottom-16 left-0 right-0 bg-[#080c14]/95 backdrop-blur-xl border-t border-dark-border/30">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <AudioRecorder
              onAnalysisComplete={(result) => handleMultimediaAnalysis(result, 'audio')}
              onError={handleMultimediaError}
            />
            <ImageUploader
              onAnalysisComplete={(result) => handleMultimediaAnalysis(result, 'image')}
              onError={handleMultimediaError}
            />

            <div className="flex-1 bg-dark-hover/40 border border-dark-border/40 rounded-xl px-4 py-2.5 focus-within:border-primary/40 focus-within:shadow-[0_0_0_1px_rgba(13,148,136,0.15)] transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Escribe, habla o sube una foto..."
                rows={1}
                className="w-full bg-transparent text-white placeholder-dark-muted/60 resize-none outline-none text-sm leading-relaxed"
                style={{ maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary to-primary-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
