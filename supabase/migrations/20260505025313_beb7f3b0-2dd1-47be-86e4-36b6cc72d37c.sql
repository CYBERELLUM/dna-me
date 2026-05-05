
-- 1. api_configurations: require authentication explicitly
DROP POLICY IF EXISTS "Users can view their own API configs" ON public.api_configurations;
DROP POLICY IF EXISTS "Users can create their own API configs" ON public.api_configurations;
DROP POLICY IF EXISTS "Users can update their own API configs" ON public.api_configurations;
DROP POLICY IF EXISTS "Users can delete their own API configs" ON public.api_configurations;

CREATE POLICY "Auth users view own API configs" ON public.api_configurations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Auth users insert own API configs" ON public.api_configurations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users update own API configs" ON public.api_configurations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Auth users delete own API configs" ON public.api_configurations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. chat_history: require authentication explicitly
DROP POLICY IF EXISTS "Users can view their own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can create their own chat messages" ON public.chat_history;
DROP POLICY IF EXISTS "Users can delete their own chat history" ON public.chat_history;

CREATE POLICY "Auth users view own chat history" ON public.chat_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Auth users insert own chat" ON public.chat_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users delete own chat" ON public.chat_history
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. federation_sync_history: admin-only read
DROP POLICY IF EXISTS "Anyone can view sync history" ON public.federation_sync_history;
CREATE POLICY "Admins view sync history" ON public.federation_sync_history
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 4. federation_nodes: admin-only access (service role bypasses RLS)
DROP POLICY IF EXISTS "nodes_all" ON public.federation_nodes;
CREATE POLICY "Admins manage nodes" ON public.federation_nodes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. federation_doctrines: admin-only
DROP POLICY IF EXISTS "doctrines_all" ON public.federation_doctrines;
CREATE POLICY "Admins manage doctrines" ON public.federation_doctrines
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 6. federation_audit_log: admin-only
DROP POLICY IF EXISTS "audit_log_all" ON public.federation_audit_log;
CREATE POLICY "Admins view audit log" ON public.federation_audit_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 7. grls_memory: admin-only
DROP POLICY IF EXISTS "grls_memory_all" ON public.grls_memory;
CREATE POLICY "Admins manage GRLS memory" ON public.grls_memory
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 8. governance_hydration_log: admin-only
DROP POLICY IF EXISTS "hydration_log_all" ON public.governance_hydration_log;
CREATE POLICY "Admins view hydration log" ON public.governance_hydration_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 9. blocked_ips: admin-only read (writes via service role only)
CREATE POLICY "Admins view blocked IPs" ON public.blocked_ips
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 10. login_attempts: admin-only read
CREATE POLICY "Admins view login attempts" ON public.login_attempts
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
