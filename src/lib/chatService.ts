import { supabase } from './supabase'
import type { Database } from './database.types'

type ChatMessage = Database['public']['Tables']['chat_messages']['Row']

export async function saveUserMessage(
  userId: string,
  content: string,
  metadata?: any
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        content: content,
        sender: 'user',
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving user message:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: data }
  } catch (error) {
    console.error('Error saving user message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function saveAssistantMessage(
  userId: string,
  content: string,
  metadata?: any
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        content: content,
        sender: 'assistant',
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving assistant message:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: data }
  } catch (error) {
    console.error('Error saving assistant message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function loadChatHistory(
  userId: string,
  limit: number = 50
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', todayISO)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error loading chat history:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messages: data }
  } catch (error) {
    console.error('Error loading chat history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function deleteChatHistory(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting chat history:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting chat history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function sendMessageToAI(
  message: string
): Promise<{ success: boolean; data?: any; error?: string; details?: string }> {
  try {
    // Refrescar sesión para obtener un token válido (previene JWT expirado)
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()

    if (sessionError || !session) {
      console.error('[chatService] Session refresh failed:', sessionError)
      return {
        success: false,
        error: 'Sesión expirada. Por favor, cierra sesión y vuelve a iniciar.',
        details: sessionError?.message
      }
    }

    if (!session.access_token) {
      console.error('[chatService] Session exists but no access_token')
      return { success: false, error: 'Sesión inválida. Por favor, cierra sesión e inicia nuevamente.' }
    }

    console.log('[chatService] Sending message to AI (session refreshed)', {
      messageLength: message.length,
      hasToken: !!session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
    })

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-food-ai`

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    }

    console.log('[chatService] Request headers prepared', {
      hasAuth: !!headers.Authorization,
      hasContentType: !!headers['Content-Type'],
      hasApikey: !!headers.apikey,
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    })

    console.log('[chatService] Response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[chatService] API Error Response:', errorData)
      return {
        success: false,
        error: errorData.error || `Error del servidor: ${response.status}`,
        details: errorData.details
      }
    }

    const result = await response.json()
    console.log('[chatService] API Success Response:', result)
    console.log('[chatService] result.data structure:', {
      hasData: !!result.data,
      hasReplyText: !!result.data?.reply_text,
      hasFoodName: !!result.data?.food_name,
      hasCalories: !!result.data?.calories,
      hasProtein: !!result.data?.protein_g,
      hasNutritionalMatrix: !!result.data?.nutritional_matrix,
      nutritionalMatrixKeys: result.data?.nutritional_matrix ? Object.keys(result.data.nutritional_matrix) : []
    })

    if (result.success && result.data) {
      return {
        success: true,
        data: {
          reply: result.data.reply_text || 'Alimento registrado correctamente',
          food: result.data,
        }
      }
    }

    return {
      success: false,
      error: result.error || 'Formato de respuesta inválido',
      details: result.details
    }
  } catch (error) {
    console.error('[chatService] Error calling AI:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
