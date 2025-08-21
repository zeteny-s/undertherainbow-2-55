-- Calendar events table
CREATE TABLE public.calendar_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    all_day boolean NOT NULL DEFAULT false,
    location text,
    color text DEFAULT '#3b82f6',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chat folders table
CREATE TABLE public.chat_folders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6b7280',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chat conversations table
CREATE TABLE public.chat_conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    folder_id uuid,
    title text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_message_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can manage their own calendar events" 
ON public.calendar_events 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat_folders
CREATE POLICY "Users can manage their own chat folders" 
ON public.chat_folders 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat_conversations
CREATE POLICY "Users can manage their own chat conversations" 
ON public.chat_conversations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can manage their own chat messages" 
ON public.chat_messages 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.chat_conversations 
ADD CONSTRAINT fk_chat_conversations_folder_id 
FOREIGN KEY (folder_id) REFERENCES public.chat_folders(id) ON DELETE SET NULL;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_calendar_events_user_id_start_time ON public.calendar_events(user_id, start_time);
CREATE INDEX idx_chat_conversations_user_id_last_message ON public.chat_conversations(user_id, last_message_at DESC);
CREATE INDEX idx_chat_messages_conversation_id_created_at ON public.chat_messages(conversation_id, created_at);

-- Create trigger for updating updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_folders_updated_at
    BEFORE UPDATE ON public.chat_folders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();