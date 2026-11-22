import { getSupabaseClient } from './supabase';
import { forgotPasswordSchema, loginSchema, roleAssignmentSchema } from '../schemas/auth';
import type { AppRole, Profile } from '../types/database';

export async function signInWithEmailPassword(email: string, password: string) {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid login credentials.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOutAdmin() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function sendPasswordResetEmail(email: string, redirectTo?: string) {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid email address.');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: redirectTo ?? `${window.location.origin}/login`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Profile | null) ?? null;
}

export async function updateUserRole(
  targetUserId: string,
  role: AppRole,
  isActive = true
): Promise<Profile> {
  const parsed = roleAssignmentSchema.safeParse({ targetUserId, role, isActive });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid role assignment payload.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('assign_user_role', {
    p_target_user_id: parsed.data.targetUserId,
    p_new_role: parsed.data.role,
    p_is_active: parsed.data.isActive,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}

export async function recordAuditEvent(
  action: string,
  entityType: string,
  entityId: string | null = null,
  metadata: Record<string, unknown> = {}
) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('write_audit_log', {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata,
  });

  if (error) {
    console.error('[AuditLog] Failed to record audit event:', error.message);
  }
}
