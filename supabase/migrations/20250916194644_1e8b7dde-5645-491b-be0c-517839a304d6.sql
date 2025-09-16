-- Fix authentication configuration security issues
-- Enable leaked password protection
UPDATE auth.config SET leaked_password_protection = true;

-- Set OTP expiry to recommended 24 hours (86400 seconds)
UPDATE auth.config SET otp_expiry = 86400;

-- Enable email confirmation for better security (can be disabled for testing if needed)
UPDATE auth.config SET enable_signup = true;
UPDATE auth.config SET enable_confirmations = true;

-- Update site URL and redirect URLs for the new domain
UPDATE auth.config SET site_url = 'https://undertherainbow-system.com';

-- Add redirect URLs for both domains to ensure compatibility
INSERT INTO auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at)
VALUES 
  (gen_random_uuid(), null, null, null, 'https://undertherainbow-system.com/', now(), now()),
  (gen_random_uuid(), null, null, null, 'https://undertherainbow-system.com/auth', now(), now())
ON CONFLICT DO NOTHING;

-- Ensure proper redirect URLs are configured
UPDATE auth.config SET 
  additional_redirect_urls = 'https://undertherainbow-system.com/,https://undertherainbow-system.com/auth,https://bea8d3a6-ff8d-4221-9e97-49f385b56b2c.lovableproject.com/';

-- Set security headers and improve auth security
UPDATE auth.config SET 
  jwt_exp = 3600,  -- 1 hour JWT expiry
  refresh_token_rotation_enabled = true,
  security_update_password_require_reauthentication = true;