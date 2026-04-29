import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null;

export async function loadCloudState() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_state")
    .select("payload, updated_at")
    .eq("id", "global")
    .maybeSingle();
  if (error) throw error;
  return data?.payload || null;
}

export async function saveCloudState(payload) {
  if (!supabase) return;
  const { error } = await supabase
    .from("app_state")
    .upsert({ id: "global", payload, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw error;
}

export function subscribeCloudState(onChange) {
  if (!supabase) return null;
  return supabase
    .channel("app_state_global_sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "app_state", filter: "id=eq.global" }, payload => {
      if (payload?.new?.payload) onChange(payload.new.payload);
    })
    .subscribe();
}
