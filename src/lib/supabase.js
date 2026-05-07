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
    .on("postgres_changes", { event: "*", schema: "public", table: "app_state", filter: "id=eq.global" }, (payload) => {
      if (payload?.new?.payload) onChange(payload.new.payload);
    })
    .subscribe();
}


function userFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    nom: row.nom || "",
    identifiant: row.identifiant || "",
    motDePasse: row.mot_de_passe || "",
    role: row.role || "salarie",
    actif: row.actif !== false,
  };
}

function userToRow(user) {
  return {
    id: user.id,
    nom: user.nom || "",
    identifiant: user.identifiant || "",
    mot_de_passe: user.motDePasse || "",
    role: user.role || "salarie",
    actif: user.actif !== false,
    updated_at: new Date().toISOString(),
  };
}

export async function loadUsersTable() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tkpa_users")
    .select("*")
    .eq("actif", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(userFromRow);
}

export async function addUserTable(user) {
  if (!supabase) return user;
  const { data, error } = await supabase
    .from("tkpa_users")
    .insert(userToRow(user))
    .select("*")
    .single();
  if (error) throw error;
  return userFromRow(data);
}

export async function updateUserTable(user) {
  if (!supabase) return user;
  const { data, error } = await supabase
    .from("tkpa_users")
    .update(userToRow(user))
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) throw error;
  return userFromRow(data);
}

export async function deleteUserTable(userId) {
  if (!supabase) return;
  const { error } = await supabase
    .from("tkpa_users")
    .update({ actif: false, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export function subscribeUsersTable(onChange) {
  if (!supabase) return null;
  return supabase
    .channel("tkpa_users_sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "tkpa_users" }, async () => {
      try {
        const users = await loadUsersTable();
        if (users) onChange(users);
      } catch (e) {
        console.error(e);
      }
    })
    .subscribe();
}
