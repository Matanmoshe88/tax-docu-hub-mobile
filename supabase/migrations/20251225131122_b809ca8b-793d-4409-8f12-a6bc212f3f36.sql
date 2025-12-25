-- Create table for temporary OTP storage
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to manage OTP codes (using service role)
-- No user-facing policies needed as this is managed by edge functions only

-- Create index for phone lookups
CREATE INDEX idx_otp_codes_phone ON public.otp_codes(phone);

-- Create index for cleanup of expired codes
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Auto-cleanup old OTP codes (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;