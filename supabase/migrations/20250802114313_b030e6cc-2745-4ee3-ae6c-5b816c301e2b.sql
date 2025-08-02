-- Create functions for messaging system
CREATE OR REPLACE FUNCTION public.get_user_threads(user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  thread_type TEXT,
  team_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  team_name TEXT,
  created_by_name TEXT,
  created_by_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.title,
    mt.thread_type,
    mt.team_id,
    mt.created_by,
    mt.created_at,
    mt.updated_at,
    mt.last_message_at,
    t.name as team_name,
    p.name as created_by_name,
    p.email as created_by_email
  FROM public.message_threads mt
  LEFT JOIN public.teams t ON mt.team_id = t.id
  LEFT JOIN public.profiles p ON mt.created_by = p.id
  WHERE mt.id IN (
    SELECT tp.thread_id 
    FROM public.thread_participants tp 
    WHERE tp.user_id = get_user_threads.user_id
  )
  ORDER BY mt.last_message_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_thread_messages(thread_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  content TEXT,
  message_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  is_edited BOOLEAN,
  parent_message_id UUID,
  sender_name TEXT,
  sender_email TEXT,
  sender_profile_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.content,
    m.message_type,
    m.created_at,
    m.updated_at,
    m.edited_at,
    m.is_edited,
    m.parent_message_id,
    p.name as sender_name,
    p.email as sender_email,
    p.profile_type as sender_profile_type
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.sender_id = p.id
  WHERE m.thread_id = get_thread_messages.thread_id
  ORDER BY m.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_thread_participants(thread_id UUID)
RETURNS TABLE (
  id UUID,
  thread_id UUID,
  user_id UUID,
  joined_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN,
  user_name TEXT,
  user_email TEXT,
  user_profile_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.id,
    tp.thread_id,
    tp.user_id,
    tp.joined_at,
    tp.last_read_at,
    tp.is_muted,
    p.name as user_name,
    p.email as user_email,
    p.profile_type as user_profile_type
  FROM public.thread_participants tp
  LEFT JOIN public.profiles p ON tp.user_id = p.id
  WHERE tp.thread_id = get_thread_participants.thread_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_thread_as_read(thread_id UUID, user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.thread_participants
  SET last_read_at = now()
  WHERE thread_participants.thread_id = mark_thread_as_read.thread_id 
    AND thread_participants.user_id = mark_thread_as_read.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_message(content_text TEXT, sender_id UUID, thread_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Insert the message
  INSERT INTO public.messages (content, sender_id, thread_id, message_type)
  VALUES (content_text, sender_id, thread_id, 'text')
  RETURNING id INTO message_id;
  
  -- Update thread's last_message_at
  UPDATE public.message_threads
  SET last_message_at = now()
  WHERE id = thread_id;
  
  RETURN message_id;
END;
$$;