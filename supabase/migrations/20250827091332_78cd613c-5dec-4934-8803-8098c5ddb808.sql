/* Fix security warnings from linter */

-- Warning 1: Auth OTP long expiry - Update OTP expiry to 1 hour (3600 seconds)
UPDATE auth.config 
SET value = '3600' 
WHERE key = 'OTP_EXPIRY';

-- Warning 2: Enable leaked password protection
UPDATE auth.config 
SET value = 'true' 
WHERE key = 'password_security.password_leaked_check';

-- If the config keys don't exist, insert them
INSERT INTO auth.config (key, value) 
VALUES ('OTP_EXPIRY', '3600') 
ON CONFLICT (key) DO UPDATE SET value = '3600';

INSERT INTO auth.config (key, value) 
VALUES ('password_security.password_leaked_check', 'true') 
ON CONFLICT (key) DO UPDATE SET value = 'true';