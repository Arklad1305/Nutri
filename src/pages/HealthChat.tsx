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
        console.log('[HealthChat] No user found, showing welcome message')
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
        console.log('[HealthChat] Setting loaded messages:', loadedMessages.length)
        setMessages(loadedMessages)
      } else {
        console.log('[HealthChat] No messages found, showing welcome message')
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

        console.log('[HealthChat] Saving assistant message with food data:', {
          hasFood: !!response.data.food,
          food: response.data.food
        })

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

      console.log('Multimedia result:', result)

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
      <div className="sticky top-0 z-10 bg-dark-card/90 backdrop-blur-xl border-b border-dark-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-md shadow-primary/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">Asistente de Salud</h1>
              <p className="text-xs text-dark-muted">
                {isLoading && processingMessage ? (
                  processingMessage
                ) : (
                  <>
                    <span className="text-primary">{format(new Date(), "d 'de' MMMM", { locale: es })}</span>
                    <span className="text-dark-muted/50 mx-1.5">•</span>
                    <span>Conversaciones de hoy</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 animate-pulse-slow bg-[length:200%_100%] animate-shimmer" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-24 mobile-scroll-hide scroll-smooth-mobile">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user'
                      ? 'bg-primary'
                      : 'bg-secondary/20'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <UserIcon className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-secondary" />
                  )}
                </div>

                <div
                  className={`flex-1 ${message.isTyping ? 'max-w-[90%]' : 'max-w-[75%]'} ${
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : message.isTyping
                        ? 'bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-primary/30 text-white rounded-tl-sm shadow-lg shadow-primary/10'
                        : 'bg-dark-card border border-dark-border text-white rounded-tl-sm'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {renderMessageContent(message)}
                    </div>
                  </div>
                  <p
                    className={`text-xs text-dark-muted mt-1 px-2 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {format(message.timestamp, 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-dark-card/90 backdrop-blur-xl border-t border-dark-border/50">
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

            <div className="flex-1 bg-dark-card border border-dark-border rounded-2xl px-4 py-2 focus-within:border-primary transition-colors">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Escribe, habla o sube una foto..."
                rows={1}
                className="w-full bg-transparent text-white placeholder-dark-muted resize-none outline-none text-sm leading-relaxed"
                style={{ maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/30"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-dark-muted text-center mt-2">
            Escribe, graba audio o sube foto de tus alimentos
          </p>
        </div>
      </div>
    </div>
  )
}
