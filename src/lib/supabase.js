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


function ficheToRow(f) {
  return {
    id: f.id,
    numero: f.numero || "",
    date_fiche: f.date || f.date_fiche || new Date().toISOString().slice(0,10),
    heure_creation: f.heureCreation || "",
    statut: f.statut || "en_attente",
    source: f.source || "sur_place",
    client_nom: f.clientNom || "",
    client_telephone: f.clientTelephone || "",
    immatriculation: f.immatriculation || "",
    vin: f.vin || "",
    marque: f.marque || "",
    marque_manuelle: f.marqueManuelle || "",
    modele: f.modele || "",
    modele_manuel: f.modeleManuel || "",
    finition: f.finition || "",
    demande_rapide: f.demandeRapide || "",
    remarque: f.remarque || "",
    archive_validee: Boolean(f.archiveValidee),
    archive_date: f.archiveDate || null,
    cree_par_id: f.creeParId || null,
    cree_par_nom: f.creeParNom || "",
    updated_at: new Date().toISOString(),
  };
}

function rowToFiche(r, pieces=[]) {
  return {
    id: r.id,
    numero: r.numero || "",
    date: r.date_fiche || "",
    heureCreation: r.heure_creation || "",
    statut: r.statut || "en_attente",
    source: r.source || "sur_place",
    clientNom: r.client_nom || "",
    clientTelephone: r.client_telephone || "",
    immatriculation: r.immatriculation || "",
    vin: r.vin || "",
    marque: r.marque || "",
    marqueManuelle: r.marque_manuelle || "",
    modele: r.modele || "",
    modeleManuel: r.modele_manuel || "",
    finition: r.finition || "",
    demandeRapide: r.demande_rapide || "",
    remarque: r.remarque || "",
    archiveValidee: Boolean(r.archive_validee),
    archiveDate: r.archive_date || "",
    creeParId: r.cree_par_id || "",
    creeParNom: r.cree_par_nom || "",
    pieces,
  };
}

function pieceToRow(p, ficheId, ordre=0) {
  return {
    id: p.id,
    fiche_id: ficheId,
    designation: p.designation || "",
    quantite: Number(p.quantite || 1),
    remarque: p.remarque || "",
    image: p.image || "",
    valide: Boolean(p.valide),
    ordre,
    updated_at: new Date().toISOString(),
  };
}

function rowToPiece(r, propositions=[]) {
  return {
    id: r.id,
    designation: r.designation || "",
    quantite: Number(r.quantite || 1),
    remarque: r.remarque || "",
    image: r.image || "",
    valide: Boolean(r.valide),
    propositions,
  };
}

function propositionToRow(pr, pieceId) {
  return {
    id: pr.id,
    piece_id: pieceId,
    numero: Number(pr.numero || 1),
    reference: pr.reference || "",
    marque: pr.marque || "",
    prix: Number(pr.prix || 0),
    note: pr.note || "",
    image: pr.image || "",
    disponibilite: pr.disponibilite || "",
    disponible_quand: pr.disponibleQuand || "",
    retenue: Boolean(pr.retenue),
    selectionnee: Boolean(pr.selectionnee),
    updated_at: new Date().toISOString(),
  };
}

function rowToProposition(r) {
  return {
    id: r.id,
    numero: Number(r.numero || 1),
    reference: r.reference || "",
    marque: r.marque || "",
    prix: String(r.prix ?? ""),
    note: r.note || "",
    image: r.image || "",
    disponibilite: r.disponibilite || "",
    disponibleQuand: r.disponible_quand || "",
    retenue: Boolean(r.retenue),
    selectionnee: Boolean(r.selectionnee),
  };
}

function devisToRow(d) {
  return {
    id: d.id,
    numero: d.numero || "",
    fiche_id: d.ficheId || d.fiche_id || null,
    date_devis: d.date || d.date_devis || new Date().toISOString().slice(0,10),
    heure_creation: d.heureCreation || "",
    client_nom: d.clientNom || "",
    client_telephone: d.clientTelephone || "",
    vehicule: d.vehicule || "",
    immatriculation: d.immatriculation || "",
    vin: d.vin || "",
    source: d.source || "sur_place",
    remarque: d.remarque || "",
    statut: d.statut || "actif",
    archive_jour_id: d.archiveJourId || "",
    cree_par_id: d.creeParId || null,
    cree_par_nom: d.creeParNom || "",
    updated_at: new Date().toISOString(),
  };
}

function rowToDevis(r, lignes=[]) {
  return {
    id: r.id,
    numero: r.numero || "",
    ficheId: r.fiche_id || "",
    date: r.date_devis || "",
    heureCreation: r.heure_creation || "",
    clientNom: r.client_nom || "",
    clientTelephone: r.client_telephone || "",
    vehicule: r.vehicule || "",
    immatriculation: r.immatriculation || "",
    vin: r.vin || "",
    source: r.source || "sur_place",
    remarque: r.remarque || "",
    statut: r.statut || "actif",
    archiveJourId: r.archive_jour_id || "",
    creeParId: r.cree_par_id || "",
    creeParNom: r.cree_par_nom || "",
    lignes,
  };
}

function ligneDevisToRow(l, devisId, ordre=0) {
  return {
    id: l.id,
    devis_id: devisId,
    designation: l.designation || "",
    quantite: Number(l.quantite || 1),
    prix_ttc: Number(l.prixTTC || 0),
    note: l.note || "",
    image: l.image || "",
    disponibilite: l.disponibilite || "",
    disponible_quand: l.disponibleQuand || "",
    ordre,
    updated_at: new Date().toISOString(),
  };
}

function rowToLigneDevis(r) {
  return {
    id: r.id,
    designation: r.designation || "",
    quantite: Number(r.quantite || 1),
    prixTTC: Number(r.prix_ttc || 0),
    note: r.note || "",
    image: r.image || "",
    disponibilite: r.disponibilite || "",
    disponibleQuand: r.disponible_quand || "",
  };
}

async function safeUpsert(table, rows, conflict="id") {
  if (!supabase || !rows?.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
  if (error) throw error;
}

export async function saveSeparatedTables(state) {
  if (!supabase) return;

  const users = state.users || [];
  const fiches = state.fiches || [];
  const devis = state.devis || [];

  if (users.length) {
    await safeUpsert("tkpa_users", users.map(userToRow));
  }

  if (fiches.length) {
    await safeUpsert("tkpa_fiches_cahier", fiches.map(ficheToRow));

    const pieces = [];
    const props = [];
    fiches.forEach((f) => {
      (f.pieces || []).forEach((p, pIndex) => {
        pieces.push(pieceToRow(p, f.id, pIndex));
        (p.propositions || []).forEach((pr) => props.push(propositionToRow(pr, p.id)));
      });
    });

    await safeUpsert("tkpa_pieces_fiche", pieces);
    await safeUpsert("tkpa_propositions_piece", props);
  }

  if (devis.length) {
    await safeUpsert("tkpa_devis_clients", devis.map(devisToRow));

    const lignes = [];
    devis.forEach((d) => {
      (d.lignes || []).forEach((l, index) => lignes.push(ligneDevisToRow(l, d.id, index)));
    });

    await safeUpsert("tkpa_lignes_devis", lignes);
  }
}

export async function loadSeparatedTables() {
  if (!supabase) return null;

  const [
    usersRes,
    fichesRes,
    piecesRes,
    propsRes,
    devisRes,
    lignesRes
  ] = await Promise.all([
    supabase.from("tkpa_users").select("*").eq("actif", true).order("created_at", { ascending: true }),
    supabase.from("tkpa_fiches_cahier").select("*").order("created_at", { ascending: false }),
    supabase.from("tkpa_pieces_fiche").select("*").order("ordre", { ascending: true }),
    supabase.from("tkpa_propositions_piece").select("*").order("numero", { ascending: true }),
    supabase.from("tkpa_devis_clients").select("*").order("created_at", { ascending: false }),
    supabase.from("tkpa_lignes_devis").select("*").order("ordre", { ascending: true }),
  ]);

  const results = [usersRes, fichesRes, piecesRes, propsRes, devisRes, lignesRes];
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;

  const propsByPiece = new Map();
  (propsRes.data || []).forEach((r) => {
    const arr = propsByPiece.get(r.piece_id) || [];
    arr.push(rowToProposition(r));
    propsByPiece.set(r.piece_id, arr);
  });

  const piecesByFiche = new Map();
  (piecesRes.data || []).forEach((r) => {
    const arr = piecesByFiche.get(r.fiche_id) || [];
    arr.push(rowToPiece(r, propsByPiece.get(r.id) || []));
    piecesByFiche.set(r.fiche_id, arr);
  });

  const lignesByDevis = new Map();
  (lignesRes.data || []).forEach((r) => {
    const arr = lignesByDevis.get(r.devis_id) || [];
    arr.push(rowToLigneDevis(r));
    lignesByDevis.set(r.devis_id, arr);
  });

  return {
    users: (usersRes.data || []).map(userFromRow),
    fiches: (fichesRes.data || []).map((r) => rowToFiche(r, piecesByFiche.get(r.id) || [])),
    devis: (devisRes.data || []).map((r) => rowToDevis(r, lignesByDevis.get(r.id) || [])),
  };
}

export function subscribeSeparatedTables(onChange) {
  if (!supabase) return null;

  const channel = supabase.channel("tkpa_tables_separees_sync");

  ["tkpa_fiches_cahier", "tkpa_pieces_fiche", "tkpa_propositions_piece", "tkpa_devis_clients", "tkpa_lignes_devis", "tkpa_users"].forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, async () => {
      try {
        const payload = await loadSeparatedTables();
        if (payload) onChange(payload);
      } catch (e) {
        console.error(e);
      }
    });
  });

  return channel.subscribe();
}
