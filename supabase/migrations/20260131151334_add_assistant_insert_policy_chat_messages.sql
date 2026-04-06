/*
  # Add Policy for Users to Insert Assistant Messages

  ## Overview
  Allows authenticated users to insert assistant messages into their own chat history.
  This is needed because the frontend application (running as authenticated user) saves
  assistant responses directly to the database after receiving them from the AI.

  ## Changes
  - Add INSERT policy for authenticated users to insert assistant messages
  - Only allows inserting messages with their own user_id

  ## Security
  - Users can only insert messages for themselves (auth.uid() = user_id)
  - Both 'user' and 'assistant' sender types are allowed
  - This is safe because users can only write to their own chat history

  ## Important Notes
  - This complements the existing "Users can insert own messages" policy
  - The previous policy only allowed sender='user', which prevented saving assistant responses
  - Now users can save both their messages (sender='user') and AI responses (sender='assistant')
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;

-- Create new policy that allows users to insert any message type for themselves
CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
