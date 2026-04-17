import { useState, useEffect, useRef } from 'react'
import { saveUserMessage, saveAssistantMessage, loadChatHistory, sendMessageToAI } from '../lib/chatService'
import { supabase } from '../lib/supabase'
import { Send, Bot, User as UserIcon, ScanBarcode } from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { CompactFoodCard } from '../components/CompactFoodCard'
import { AudioRecorder } from '../components/AudioRecorder'
import { ImageUploader } from '../components/ImageUploader'
import { ProcessingSteps } from '../components/ProcessingSteps'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { lookupBarcode } from '../lib/barcodeService'

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  data?: any
  isTyping?: boolean
  processingType?: 'text' | 'audio' | 'image'
}

interface QuickFood {
  name: string
  count: number
}

function QuickFoodsBar({ onSelect, disabled }: { onSelect: (name: string) => void; disabled: boolean }) {
  const [foods, setFoods] = useState<QuickFood[]>([])

  useEffect(() => {
    loadFrequentFoods()
  }, [])

  const loadFrequentFoods = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const since = startOfDay(subDays(new Date(), 30)).toISOString()
    const { data } = await supabase
      .from('food_logs')
      .select('food_name')
      .eq('user_id', user.id)
      .gte('logged_at', since)

    if (!data || data.length === 0) return

    const freq: Record<string, number> = {}
    data.forEach(log => {
      const name = log.food_name?.trim()
      if (name) freq[name] = (freq[name] || 0) + 1
    })

    const sorted = Object.entries(freq)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    setFoods(sorted)
  }

  if (foods.length === 0) return null

  return (
    <div className="px-4 py-2 border-b border-dark-border/30">
      <p className="text-[10px] text-dark-muted mb-1.5 font-medium">Frecuentes</p>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {foods.map(f => (
          <button
            key={f.name}
            onClick={() => onSelect(f.name)}
            disabled={disabled}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-dark-hover border border-dark-border text-xs text-dark-text hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-30"
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export function HealthChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [processingMessage, setProcessingMessage] = useState<string>('')
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  const [barcodeProcessing, setBarcodeProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { scrollToBottom() }, [messages])
  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setMessages([welcomeMsg()]); return }

      const result = await loadChatHistory(user.id, 50)
      if (result.success && result.messages && result.messages.length > 0) {
        setMessages(result.messages.map(msg => ({
          id: msg.id.toString(),
          content: msg.content,
          sender: msg.sender as 'user' | 'assistant',
          timestamp: new Date(msg.created_at),
          data: msg.metadata,
        })))
      } else {
        setMessages([welcomeMsg()])
      }
    } catch {
      setMessages([welcomeMsg()])
    }
  }

  const welcomeMsg = (): Message => ({
    id: '0',
    content: 'Hola, soy tu asistente nutricional. Puedo analizar alimentos, calcular macros y responder dudas sobre nutrición.\n\n¿Qué comiste hoy?',
    sender: 'assistant',
    timestamp: new Date(),
  })

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  const sendText = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(), content: text, sender: 'user', timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    const typingMsg: Message = {
      id: 'typing-' + Date.now(), content: '', sender: 'assistant',
      timestamp: new Date(), isTyping: true, processingType: 'text',
    }
    setMessages(prev => [...prev, typingMsg])
    setProcessingMessage('Procesando...')

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await saveUserMessage(user.id, text)

      const response = await sendMessageToAI(text)
      setMessages(prev => prev.filter(msg => !msg.isTyping))

      if (response.success && response.data) {
        const replyText = response.data.reply || 'Respuesta recibida'
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(), content: replyText,
          sender: 'assistant', timestamp: new Date(), data: response.data.food,
        }
        setMessages(prev => [...prev, assistantMessage])
        if (user) await saveAssistantMessage(user.id, replyText, response.data.food)
      } else {
        setMessages(prev => prev.filter(msg => !msg.isTyping))
        let errorText = response.error || 'Error al procesar tu mensaje.'
        if (response.error?.includes('GEMINI_API_KEY')) errorText = 'API key no configurado.'
        else if (response.error?.includes('Unauthorized')) errorText = 'Sesión expirada. Vuelve a iniciar sesión.'
        else if (response.details) errorText += `\n\n${response.details}`
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content: errorText, sender: 'assistant', timestamp: new Date() }])
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => !msg.isTyping))
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`,
        sender: 'assistant', timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
      setProcessingMessage('')
    }
  }

  const handleMultimediaAnalysis = async (result: any, type: 'audio' | 'image') => {
    setIsLoading(true)
    const label = type === 'audio' ? 'Audio enviado' : 'Imagen enviada'
    setMessages(prev => [...prev, { id: Date.now().toString(), content: label, sender: 'user', timestamp: new Date() }])

    const typingMsg: Message = {
      id: 'typing-' + Date.now(), content: '', sender: 'assistant',
      timestamp: new Date(), isTyping: true, processingType: type,
    }
    setMessages(prev => [...prev, typingMsg])
    setProcessingMessage(type === 'audio' ? 'Procesando audio...' : 'Analizando imagen...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await saveUserMessage(user.id, label)
      setMessages(prev => prev.filter(msg => !msg.isTyping))

      if (result.success && result.data) {
        const replyText = result.data.reply_text || `${result.data.food_name || 'Alimento'} registrado`
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(), content: replyText,
          sender: 'assistant', timestamp: new Date(), data: result.data,
        }
        setMessages(prev => [...prev, assistantMessage])
        if (user) await saveAssistantMessage(user.id, replyText, result.data)
      } else {
        throw new Error(result.error || 'Error al procesar')
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => !msg.isTyping))
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`,
        sender: 'assistant', timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
      setProcessingMessage('')
    }
  }

  const handleMultimediaError = (error: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), content: error, sender: 'assistant', timestamp: new Date() }])
  }

  const handleBarcodeDetected = async (barcode: string) => {
    setBarcodeProcessing(true)
    const result = await lookupBarcode(barcode)
    setBarcodeProcessing(false)
    setBarcodeOpen(false)
    if (result.success && result.data) {
      handleMultimediaAnalysis({ success: true, data: result.data }, 'image')
    } else {
      handleMultimediaError(result.error || 'Producto no encontrado')
    }
  }

  const renderMessageContent = (message: Message) => {
    if (message.isTyping && message.processingType) return <ProcessingSteps type={message.processingType} />
    const hasData = message.data && typeof message.data === 'object' &&
      (message.data.name || message.data.food_name || message.data.calories || message.data.macros)
    if (hasData) {
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
      {barcodeOpen && (
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          onClose={() => setBarcodeOpen(false)}
          isProcessing={barcodeProcessing}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-card/95 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-dark-hover flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-sm font-semibold text-dark-text">Asistente Nutricional</h1>
              <p className="text-[10px] text-dark-muted">
                {isLoading ? (
                  <span className="text-primary">{processingMessage}</span>
                ) : (
                  format(new Date(), "d 'de' MMMM", { locale: es })
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-36 scrollbar-hide">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                  message.sender === 'user' ? 'bg-primary' : 'bg-dark-hover border border-dark-border'
                }`}>
                  {message.sender === 'user'
                    ? <UserIcon className="w-3.5 h-3.5 text-white" />
                    : <Bot className="w-3.5 h-3.5 text-dark-muted" />
                  }
                </div>

                <div className={`flex-1 max-w-[80%]`}>
                  <div className={`rounded-xl px-3.5 py-2.5 text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-dark-card border border-dark-border text-dark-text rounded-tl-sm'
                  }`}>
                    {renderMessageContent(message)}
                  </div>
                  <p className={`text-[10px] text-dark-muted mt-1 px-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                    {format(message.timestamp, 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Quick Foods + Input */}
      <div className="fixed bottom-14 left-0 right-0 bg-dark-card/95 backdrop-blur-md border-t border-dark-border">
        <QuickFoodsBar onSelect={(name) => sendText(name)} disabled={isLoading} />

        <div className="max-w-lg mx-auto px-4 py-2.5">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setBarcodeOpen(true)}
              disabled={isLoading}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-dark-hover border border-dark-border hover:border-primary/30 transition-colors disabled:opacity-30"
            >
              <ScanBarcode className="w-4 h-4 text-dark-muted" />
            </button>

            <AudioRecorder
              onAnalysisComplete={(result) => handleMultimediaAnalysis(result, 'audio')}
              onError={handleMultimediaError}
            />
            <ImageUploader
              onAnalysisComplete={(result) => handleMultimediaAnalysis(result, 'image')}
              onError={handleMultimediaError}
            />

            <div className="flex-1 bg-dark-hover border border-dark-border rounded-lg px-3 py-2 focus-within:border-primary/40 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                }}
                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(inputMessage) } }}
                placeholder="Qué comiste?"
                rows={1}
                className="w-full bg-transparent text-dark-text placeholder-dark-muted resize-none outline-none text-sm"
                style={{ maxHeight: '100px' }}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={() => sendText(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
