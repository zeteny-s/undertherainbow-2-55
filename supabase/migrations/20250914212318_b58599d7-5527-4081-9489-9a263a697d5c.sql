-- Create email campaigns table to log email sends
CREATE TABLE public.email_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  recipients text[] NOT NULL DEFAULT '{}',
  content text,
  sent_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view email campaigns they sent" 
ON public.email_campaigns 
FOR SELECT 
USING (auth.uid() = sent_by);

CREATE POLICY "Users can create email campaigns" 
ON public.email_campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = sent_by);

-- Add trigger for timestamps
CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();