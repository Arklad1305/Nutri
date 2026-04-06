/*
  # Add DELETE Policy for Chat Messages
  
  ## Overview
  Adds a DELETE policy to allow users to delete their own chat history.
  This is useful for privacy and allowing users to clear their conversation history.
  
  ## Changes
  - Add DELETE policy for chat_messages table
  - Users can delete their own messages only
  
  ## Security
  - Only authenticated users can delete
  - Users can only delete messages where user_id matches their auth.uid()
*/

-- Add DELETE policy for chat messages
CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
