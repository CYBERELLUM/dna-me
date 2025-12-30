-- Create table for tracking login attempts
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_email_ip_time ON public.login_attempts(email, ip_address, created_at DESC);

-- Enable RLS (but allow service role full access for edge function)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access this table
-- This ensures login data is only accessible server-side

-- Create table for blocked IPs
CREATE TABLE public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMP WITH TIME ZONE,
  permanent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blocked_ips
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Create index for IP lookups
CREATE INDEX idx_blocked_ips_address ON public.blocked_ips(ip_address);

-- Create function to check rate limits and suspicious activity
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_email TEXT,
  p_ip_address TEXT,
  p_window_minutes INT DEFAULT 15,
  p_max_attempts INT DEFAULT 5
)
RETURNS TABLE (
  is_blocked BOOLEAN,
  block_reason TEXT,
  attempts_remaining INT,
  cooldown_seconds INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked_record RECORD;
  v_recent_failures INT;
  v_ip_failures INT;
  v_last_attempt TIMESTAMP WITH TIME ZONE;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check if IP is permanently blocked
  SELECT * INTO v_blocked_record
  FROM public.blocked_ips
  WHERE ip_address = p_ip_address
    AND (permanent = true OR blocked_until > now());
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      true::BOOLEAN,
      v_blocked_record.reason::TEXT,
      0::INT,
      CASE 
        WHEN v_blocked_record.permanent THEN 999999
        ELSE EXTRACT(EPOCH FROM (v_blocked_record.blocked_until - now()))::INT
      END;
    RETURN;
  END IF;
  
  -- Count recent failed attempts for this email
  SELECT COUNT(*), MAX(created_at)
  INTO v_recent_failures, v_last_attempt
  FROM public.login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > v_window_start;
  
  -- Count recent failed attempts from this IP across all emails
  SELECT COUNT(*)
  INTO v_ip_failures
  FROM public.login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND created_at > v_window_start;
  
  -- Check if rate limit exceeded for email
  IF v_recent_failures >= p_max_attempts THEN
    RETURN QUERY SELECT 
      true::BOOLEAN,
      'Too many failed login attempts for this account. Please try again later.'::TEXT,
      0::INT,
      EXTRACT(EPOCH FROM (v_last_attempt + (p_window_minutes || ' minutes')::INTERVAL - now()))::INT;
    RETURN;
  END IF;
  
  -- Check if rate limit exceeded for IP (stricter - 10 attempts)
  IF v_ip_failures >= 10 THEN
    -- Auto-block IP temporarily
    INSERT INTO public.blocked_ips (ip_address, reason, blocked_until)
    VALUES (p_ip_address, 'Automatic block: Excessive failed login attempts', now() + INTERVAL '1 hour')
    ON CONFLICT (ip_address) DO UPDATE SET
      blocked_until = EXCLUDED.blocked_until,
      reason = EXCLUDED.reason;
    
    RETURN QUERY SELECT 
      true::BOOLEAN,
      'Too many failed login attempts from your network. Please try again in 1 hour.'::TEXT,
      0::INT,
      3600::INT;
    RETURN;
  END IF;
  
  -- Return success - not blocked
  RETURN QUERY SELECT 
    false::BOOLEAN,
    NULL::TEXT,
    (p_max_attempts - v_recent_failures)::INT,
    0::INT;
END;
$$;

-- Create function to detect suspicious patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_login(
  p_email TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS TABLE (
  is_suspicious BOOLEAN,
  suspicion_reason TEXT,
  risk_score INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_score INT := 0;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_known_ips INT;
  v_recent_countries INT;
  v_rapid_attempts INT;
BEGIN
  -- Check for rapid-fire attempts (more than 3 in last minute)
  SELECT COUNT(*) INTO v_rapid_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND created_at > now() - INTERVAL '1 minute';
  
  IF v_rapid_attempts > 3 THEN
    v_risk_score := v_risk_score + 30;
    v_reasons := array_append(v_reasons, 'Rapid login attempts detected');
  END IF;
  
  -- Check if this is a new IP for this email
  SELECT COUNT(DISTINCT ip_address) INTO v_known_ips
  FROM public.login_attempts
  WHERE email = p_email
    AND success = true
    AND ip_address = p_ip_address;
  
  IF v_known_ips = 0 THEN
    -- First time from this IP
    SELECT COUNT(DISTINCT ip_address) INTO v_known_ips
    FROM public.login_attempts
    WHERE email = p_email
      AND success = true;
    
    IF v_known_ips > 0 THEN
      v_risk_score := v_risk_score + 20;
      v_reasons := array_append(v_reasons, 'Login from new IP address');
    END IF;
  END IF;
  
  -- Check for user agent anomalies (missing or suspicious)
  IF p_user_agent IS NULL OR length(p_user_agent) < 20 THEN
    v_risk_score := v_risk_score + 15;
    v_reasons := array_append(v_reasons, 'Missing or suspicious user agent');
  END IF;
  
  -- Check for bot-like patterns in user agent
  IF p_user_agent ~* '(curl|wget|python|bot|spider|crawler|scraper)' THEN
    v_risk_score := v_risk_score + 40;
    v_reasons := array_append(v_reasons, 'Automated tool detected in user agent');
  END IF;
  
  -- Check for multiple failed attempts followed by success (could indicate brute force)
  DECLARE
    v_recent_pattern RECORD;
  BEGIN
    SELECT 
      COUNT(*) FILTER (WHERE success = false) as failures,
      COUNT(*) FILTER (WHERE success = true) as successes
    INTO v_recent_pattern
    FROM public.login_attempts
    WHERE email = p_email
      AND created_at > now() - INTERVAL '1 hour';
    
    IF v_recent_pattern.failures > 3 THEN
      v_risk_score := v_risk_score + 25;
      v_reasons := array_append(v_reasons, 'Multiple recent failed attempts');
    END IF;
  END;
  
  RETURN QUERY SELECT 
    (v_risk_score >= 50)::BOOLEAN,
    CASE 
      WHEN array_length(v_reasons, 1) > 0 
      THEN array_to_string(v_reasons, '; ')
      ELSE NULL
    END::TEXT,
    v_risk_score::INT;
END;
$$;

-- Create function to log login attempt
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success, failure_reason)
  VALUES (p_email, p_ip_address, p_user_agent, p_success, p_failure_reason)
  RETURNING id INTO v_id;
  
  -- Clean up old records (keep last 30 days)
  DELETE FROM public.login_attempts
  WHERE created_at < now() - INTERVAL '30 days';
  
  RETURN v_id;
END;
$$;