
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen, Search, Plus, Printer, Trash2, Edit3, Save, X, Phone,
  Shield, Users, ImagePlus, LogOut, Car, Euro, FileText, ClipboardList,
  CheckCircle2, Archive, Clock
} from "lucide-react";
import "./styles.css";
import logo from "./assets/logo.png";
import hero from "./assets/dashboard-hero.jpeg";

const ENTREPRISE = {
  nom: "THE KING PIÈCES AUTOS",
  slogan: "Vente toutes marques",
  telFixe: "01 84 74 15 00",
  whatsapp: "06 50 05 89 45",
  email: "thekingpiecesautos@gmail.com",
  adresse: "32 AV MARCEL CACHIN, 93240 STAINS",
};

const LS_KEY = "tkpa_cahier_final_v1";

const CAR_MODELS = {
  "Peugeot": ["106","107","108","206","207","208","307","308","407","508","2008","3008","5008","Partner","Expert","Boxer"],
  "Renault": ["Clio","Megane","Scenic","Captur","Kadjar","Kangoo","Trafic","Master","Twingo","Laguna","Espace"],
  "Citroën": ["C1","C2","C3","C4","C5","C3 Aircross","C4 Picasso","C5 Aircross","Berlingo","Jumpy","Jumper"],
  "Volkswagen": ["Polo","Golf","Passat","Touran","Tiguan","T-Roc","T-Cross","Caddy","Transporter","Crafter"],
  "Audi": ["A1","A3","A4","A5","A6","Q2","Q3","Q5","Q7","TT"],
  "BMW": ["Série 1","Série 2","Série 3","Série 5","X1","X3","X5"],
  "Mercedes-Benz": ["Classe A","Classe B","Classe C","Classe E","CLA","GLA","GLC","Vito","Sprinter"],
  "Ford": ["Fiesta","Focus","Kuga","C-Max","Mondeo","Transit","Ranger"],
  "Opel": ["Corsa","Astra","Mokka","Insignia","Zafira","Vivaro","Movano"],
  "Fiat": ["500","Panda","Punto","Tipo","Doblo","Ducato"],
  "Toyota": ["Yaris","Auris","Corolla","RAV4","C-HR","Aygo","Hilux"],
  "Nissan": ["Micra","Juke","Qashqai","X-Trail","Note","NV200"],
  "Dacia": ["Sandero","Logan","Duster","Dokker","Lodgy","Jogger"],
  "Hyundai": ["i10","i20","i30","Tucson","Kona","Santa Fe"],
  "Kia": ["Picanto","Rio","Ceed","Sportage","Niro","Stonic"],
  "Seat": ["Ibiza","Leon","Ateca","Arona","Alhambra"],
  "Skoda": ["Fabia","Octavia","Superb","Kodiaq","Karoq"],
  "Volvo": ["V40","V60","V70","XC40","XC60","XC90"],
  "Autre": ["Modèle à saisir manuellement"]
};
const CAR_BRANDS = Object.keys(CAR_MODELS);

const initialUsers = [
  { id: "admin", nom: "Administrateur", identifiant: "admin", motDePasse: "admin", role: "admin" },
  { id: "poste1", nom: "Poste 1", identifiant: "poste1", motDePasse: "1234", role: "salarie" },
  { id: "poste2", nom: "Poste 2", identifiant: "poste2", motDePasse: "1234", role: "salarie" },
  { id: "poste3", nom: "Poste 3", identifiant: "poste3", motDePasse: "1234", role: "salarie" },
];

function uid() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function money(n) { return `${Number(n || 0).toFixed(2)} €`; }
function splitPieces(txt) { return String(txt || "").split(/\n|,|;/).map(x => x.trim()).filter(Boolean); }
function isSameDay(d, day=today()) { return String(d||"").slice(0,10) === day; }

function propositionEmpty(num) {
  return { id: uid(), numero: num, reference: "", marque: "", prix: "", note: "", image: "", selectionnee: num === 1, retenue: num === 1 };
}
function emptyPiece(nom = "") {
  return { id: uid(), designation: nom, valide: false, image: "", remarque: "", propositions: [propositionEmpty(1), propositionEmpty(2)] };
}
function emptyFiche(user) {
  return {
    id: uid(),
    numero: `FICHE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    date: today(),
    source: "sur_place",
    statut: "en_attente",
    archiveValidee: false,
    demandeRapide: "",
    clientNom: "",
    clientTelephone: "",
    immatriculation: "",
    vin: "",
    marque: "",
    modele: "",
    finition: "",
    remarque: "",
    creeParId: user?.id || "",
    creeParNom: user?.nom || "",
    pieces: [],
  };
}

function selectedProps(piece) {
  const props = piece.propositions || [];
  const selected = props.filter((p) => p.selectionnee || p.retenue);
  return selected.length ? selected : props;
}
function totalProposition(f, index) {
  return (f.pieces || []).reduce((sum, p) => {
    const prop = (p.propositions || [])[index] || {};
    return prop.selectionnee || prop.retenue ? sum + Number(prop.prix || 0) : sum;
  }, 0);
}
function totalFiche(f) {
  return (f.pieces || []).reduce((sum, p) => {
    return sum + selectedProps(p).reduce((s, pr) => s + Number(pr.prix || 0), 0);
  }, 0);
}
function loadState() {
  try { const x = localStorage.getItem(LS_KEY); if (x) return JSON.parse(x); } catch {}
  return { users: initialUsers, fiches: [] };
}
function saveState(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

function Header({ title, subtitle }) {
  return <div className="header"><h1>{title}</h1><p>{subtitle}</p></div>;
}

function App() {
  const [data, setData] = useState(loadState);
  const [login, setLogin] = useState({ identifiant: "", motDePasse: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [openPieceId, setOpenPieceId] = useState("");
  const [userForm, setUserForm] = useState({ nom: "", identifiant: "", motDePasse: "", role: "salarie" });

  function commit(next) { setData(next); saveState(next); }
  function connect(e) {
    e.preventDefault();
    const u = data.users.find(x => x.identifiant.toLowerCase() === login.identifiant.trim().toLowerCase() && x.motDePasse === login.motDePasse);
    if (!u) return alert("Identifiant ou mot de passe incorrect.");
    setCurrentUser(u);
    setSelectedUserId(u.role === "admin" ? "all" : u.id);
  }
  function newFiche() {
    const f = emptyFiche(currentUser);
    setEditing(f);
    setOpenPieceId("");
    setActive("edition");
  }
  function saveFiche() {
    const f = { ...editing };
    if (!f.demandeRapide && (!f.pieces || !f.pieces.length) && !f.immatriculation && !f.clientTelephone) {
      return alert("Écris au minimum une demande, une plaque ou un téléphone.");
    }
    const exists = data.fiches.some(x => x.id === f.id);
    const fiches = exists ? data.fiches.map(x => x.id === f.id ? f : x) : [f, ...data.fiches];
    commit({ ...data, fiches });
    setActive("cahiers");
  }
  function canEdit(f) { return currentUser?.role === "admin" || f.creeParId === currentUser?.id; }
  function canDelete() { return currentUser?.role === "admin"; }

  const visibleFiches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.fiches
      .filter(f => currentUser?.role === "admin" || f.creeParId === currentUser?.id || selectedUserId === f.creeParId)
      .filter(f => selectedUserId === "all" || f.creeParId === selectedUserId)
      .filter(f => {
        if (!q) return true;
        const text = [
          f.numero, f.clientNom, f.clientTelephone, f.immatriculation, f.vin, f.marque, f.modele, f.creeParNom,
          f.demandeRapide,
          ...(f.pieces || []).flatMap(p => [p.designation, ...((p.propositions || []).flatMap(pr => [pr.reference, pr.marque, pr.prix]))])
        ].join(" ").toLowerCase();
        return text.includes(q);
      });
  }, [data.fiches, search, selectedUserId, currentUser]);

  if (!currentUser) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand">
            <img src={logo} />
            <div><h1>{ENTREPRISE.nom}</h1><p>Cahier professionnel des demandes pièces</p></div>
          </div>
          <form onSubmit={connect} className="login-form">
            <label>Identifiant<input value={login.identifiant} onChange={e => setLogin({...login, identifiant:e.target.value})} /></label>
            <label>Mot de passe<input type="password" value={login.motDePasse} onChange={e => setLogin({...login, motDePasse:e.target.value})} /></label>
            <button className="primary full">Connexion</button>
          </form>
          <div className="hint">Accès test : admin/admin — poste1/1234 — poste2/1234 — poste3/1234</div>
        </div>
      </div>
    );
  }

  const statsByUser = data.users.map(u => {
    const docs = data.fiches.filter(f => f.creeParId === u.id);
    const day = docs.filter(f => isSameDay(f.date));
    return { user:u, total:docs.length, today:day.length, validated:day.filter(f => f.archiveValidee).length, amount:day.reduce((s,f)=>s+totalFiche(f),0) };
  });

  return (
    <div className="app">
      <aside>
        <div className="side-brand">
          <img src={logo} />
          <b>{ENTREPRISE.nom}</b>
          <small>{currentUser.nom} · {currentUser.role === "admin" ? "Administrateur" : "Salarié"}</small>
        </div>
        <nav>
          <button className={active==="dashboard" ? "on":""} onClick={()=>setActive("dashboard")}><BookOpen/>Tableau de bord</button>
          <button className={active==="cahiers" ? "on":""} onClick={()=>setActive("cahiers")}><Archive/>Archives / recherches</button>
          <button onClick={newFiche}><Plus/>Nouvelle demande rapide</button>
          {currentUser.role === "admin" && <button className={active==="users" ? "on":""} onClick={()=>setActive("users")}><Users/>Utilisateurs</button>}
          <button onClick={()=>setCurrentUser(null)}><LogOut/>Déconnexion</button>
        </nav>
      </aside>

      <main>
        {active === "dashboard" && (
          <section>
            <div className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(7,21,60,.92), rgba(7,21,60,.55)), url(${hero})` }}>
              <div>
                <h1>Cahier centralisé</h1>
                <p>Tu peux recevoir plusieurs demandes en même temps, les mettre de côté, puis revenir sur chaque fiche pour compléter les références et les prix.</p>
                <button className="primary" onClick={newFiche}><Plus/>Nouvelle demande</button>
              </div>
            </div>

            <div className="stats">
              <div><FileText/><b>{data.fiches.length}</b><span>Total fiches</span></div>
              <div><Clock/><b>{data.fiches.filter(f=>f.statut==="en_attente").length}</b><span>Demandes en attente</span></div>
              <div><CheckCircle2/><b>{data.fiches.filter(f=>f.archiveValidee).length}</b><span>Archives validées</span></div>
              <div><Shield/><b>{data.fiches.filter(f=>isSameDay(f.date)).length}</b><span>Fiches du jour</span></div>
            </div>

            <div className="dashboard-grid">
              <div className="panel">
                <h3>Nombre de fiches par cahier salarié</h3>
                <div className="employee-table">
                  <div className="employee-head"><span>Cahier</span><span>Total</span><span>Aujourd’hui</span><span>Validées</span><span>Montant</span></div>
                  {statsByUser.map(s => (
                    <div className="employee-row" key={s.user.id}>
                      <b>{s.user.nom}</b><span>{s.total}</span><span>{s.today}</span><span>{s.validated}</span><span>{money(s.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h3>Demandes à reprendre</h3>
                <div className="today-list">
                  {data.fiches
                    .filter(f => f.statut !== "termine")
                    .filter(f => currentUser.role === "admin" || f.creeParId === currentUser.id)
                    .slice(0, 10)
                    .map(f => (
                      <button key={f.id} onClick={()=>{setEditing(f); setOpenPieceId(f.pieces?.[0]?.id || ""); setActive("edition");}}>
                        <span><b>{f.immatriculation || f.clientTelephone || "Demande sans plaque"}</b><small>{f.creeParNom} · {splitPieces(f.demandeRapide).slice(0,3).join(", ")}</small></span>
                        <strong>{f.pieces?.length || splitPieces(f.demandeRapide).length} pièce(s)</strong>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {currentUser.role === "admin" && (
              <div className="panel admin-monitor">
                <h3>Contrôle administrateur — fiches par salarié</h3>
                {data.users.map(u => {
                  const docs = data.fiches.filter(f => f.creeParId === u.id);
                  return (
                    <div className="admin-employee-block" key={u.id}>
                      <div className="admin-employee-title"><b>{u.nom}</b><span>{docs.length} fiche(s)</span></div>
                      <div className="admin-docs">
                        {docs.slice(0, 8).map(f => (
                          <button key={f.id} onClick={()=>{setEditing(f); setOpenPieceId(f.pieces?.[0]?.id || ""); setActive("edition");}}>
                            <b>{f.numero}</b><span>{f.date}</span><span>{f.immatriculation || "Sans plaque"}</span><span>{money(totalFiche(f))}</span>
                          </button>
                        ))}
                        {!docs.length && <small>Aucune fiche.</small>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {active === "cahiers" && (
          <section>
            <Header title="Archives et recherches" subtitle="Recherche par plaque, VIN, téléphone, client, référence ou salarié." />
            <div className="toolbar">
              <div className="search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par plaque d’immatriculation..." /></div>
              <select value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)}>
                <option value="all">Tous les cahiers</option>
                {data.users.map(u => <option key={u.id} value={u.id}>Cahier de {u.nom}</option>)}
              </select>
              <button className="primary" onClick={newFiche}><Plus/>Nouvelle</button>
            </div>

            <div className="cards">
              {visibleFiches.map(f => (
                <article className="fiche-card" key={f.id}>
                  <div className="card-top"><div><b>{f.numero}</b><small>{f.date} · {f.creeParNom}</small></div><span className={`badge ${f.archiveValidee ? "termine":""}`}>{f.archiveValidee ? "Archivé" : "À reprendre"}</span></div>
                  <h3>{f.clientNom || "Client non renseigné"}</h3>
                  <p><Car size={16}/>{f.immatriculation || "Plaque non renseignée"} — {[f.marque, f.modele, f.finition].filter(Boolean).join(" ") || "Véhicule non renseigné"}</p>
                  <p><Phone size={16}/>{f.clientTelephone || "Téléphone non renseigné"}</p>
                  <div className="mini-pieces">
                    {((f.pieces || []).length ? f.pieces : splitPieces(f.demandeRapide).map(x => ({id:x, designation:x}))).slice(0,5).map(p => <span key={p.id}>{p.designation}</span>)}
                  </div>
                  <div className="actions">
                    <button onClick={()=>printFiche(f)}><Printer/>Fiche archive</button>
                    {canEdit(f) && <button onClick={()=>{setEditing(f); setOpenPieceId(f.pieces?.[0]?.id || ""); setActive("edition");}}><Edit3/>Ouvrir</button>}
                    {canDelete() && <button className="danger" onClick={()=>{if(confirm("Supprimer cette fiche ?")) commit({...data, fiches:data.fiches.filter(x=>x.id!==f.id)});}}><Trash2/>Supprimer</button>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {active === "edition" && editing && (
          <Editor
            editing={editing}
            setEditing={setEditing}
            openPieceId={openPieceId}
            setOpenPieceId={setOpenPieceId}
            saveFiche={saveFiche}
            cancel={()=>setActive("cahiers")}
          />
        )}

        {active === "users" && currentUser.role === "admin" && (
          <section>
            <Header title="Utilisateurs" subtitle="Chaque salarié a son cahier. L’administrateur voit tout et peut supprimer." />
            <div className="user-grid">
              <div className="panel">
                <h3>Créer utilisateur</h3>
                <input placeholder="Nom" value={userForm.nom} onChange={e=>setUserForm({...userForm, nom:e.target.value})}/>
                <input placeholder="Identifiant" value={userForm.identifiant} onChange={e=>setUserForm({...userForm, identifiant:e.target.value})}/>
                <input placeholder="Mot de passe" value={userForm.motDePasse} onChange={e=>setUserForm({...userForm, motDePasse:e.target.value})}/>
                <select value={userForm.role} onChange={e=>setUserForm({...userForm, role:e.target.value})}><option value="salarie">Salarié</option><option value="admin">Admin</option></select>
                <button className="primary" onClick={()=>{if(!userForm.nom||!userForm.identifiant||!userForm.motDePasse)return alert("Remplis tout."); commit({...data, users:[...data.users,{...userForm,id:uid()}]}); setUserForm({nom:"",identifiant:"",motDePasse:"",role:"salarie"});}}><Plus/>Ajouter</button>
              </div>
              <div className="panel">
                <h3>Liste</h3>
                {data.users.map(u => <div className="user-row" key={u.id}><div><b>{u.nom}</b><small>{u.identifiant} · {u.role} · mot de passe : {u.motDePasse}</small></div></div>)}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Editor({ editing, setEditing, openPieceId, setOpenPieceId, saveFiche, cancel }) {
  const pieceOuverte = (editing.pieces || []).find(p => p.id === openPieceId) || null;
  function setField(k,v){ setEditing({...editing,[k]:v}); }
  function updatePiece(pieceId, patch){ setEditing({...editing, pieces:(editing.pieces||[]).map(p=>p.id===pieceId ? {...p,...patch}:p)}); }
  function updateProp(pieceId, idx, patch){
    setEditing({
      ...editing,
      pieces:(editing.pieces||[]).map(p=>{
        if(p.id!==pieceId) return p;
        const props = [...(p.propositions || [propositionEmpty(1), propositionEmpty(2)])];
        props[idx] = {...(props[idx] || propositionEmpty(idx+1)), ...patch};
        return {...p, propositions:props};
      })
    });
  }
  function togglePropSelection(pieceId, idx, checked){
    setEditing({
      ...editing,
      pieces:(editing.pieces||[]).map(p=>{
        if(p.id!==pieceId) return p;
        const props = (p.propositions || [propositionEmpty(1), propositionEmpty(2)]).map((pr,i)=>(
          i === idx ? {...pr, selectionnee: checked, retenue: checked} : pr
        ));
        return {...p, propositions:props};
      })
    });
  }
  function imageToBase64(file,pieceId){
    const r=new FileReader();
    r.onload=()=>updatePiece(pieceId,{image:r.result});
    r.readAsDataURL(file);
  }

  function imageToBase64Prop(file, pieceId, idx) {
    const r = new FileReader();
    r.onload = () => updateProp(pieceId, idx, { image: r.result });
    r.readAsDataURL(file);
  }
  function preparerRecherche(){
    const noms = splitPieces(editing.demandeRapide);
    if(!noms.length) return alert("Écris au minimum une pièce dans la demande rapide.");
    const existants = (editing.pieces||[]).map(p=>p.designation.toLowerCase());
    const nouvelles = noms.filter(n=>!existants.includes(n.toLowerCase())).map(n=>emptyPiece(n));
    const pieces = [...(editing.pieces||[]), ...nouvelles];
    setEditing({...editing, pieces, statut:"en_recherche"});
    setOpenPieceId(pieces[0]?.id || "");
  }
  function validerArchive(){
    if(!(editing.pieces||[]).length) return alert("Prépare d’abord la recherche avec la liste de pièces.");
    const incompletes = editing.pieces.filter(p => {
      const selected = (p.propositions || []).filter(pr => pr.selectionnee || pr.retenue);
      return !p.designation || !selected.length || selected.some(pr => !pr.reference || !pr.prix);
    });
    if(incompletes.length) return alert("Chaque pièce doit avoir au moins une proposition sélectionnée avec référence et prix.");
    setEditing({...editing, archiveValidee:true, statut:"termine"});
    alert("Fiche validée. Clique sur Archiver / Enregistrer.");
  }

  return (
    <section>
      <Header title="Fiche technique pièces" subtitle="Tu peux mettre plusieurs demandes de côté, puis revenir dessus pour compléter chaque pièce." />
      <div className="editor">
        <div className="panel">
          <h3>Informations client / véhicule</h3>
          <div className="grid2">
            <label>Numéro fiche<input value={editing.numero} onChange={e=>setField("numero",e.target.value)}/></label>
            <label>Date<input type="date" value={editing.date} onChange={e=>setField("date",e.target.value)}/></label>
            <label>Source<select value={editing.source} onChange={e=>setField("source",e.target.value)}><option value="sur_place">Sur place</option><option value="telephone">Téléphone</option><option value="whatsapp">WhatsApp</option></select></label>
            <label>Statut<select value={editing.statut} onChange={e=>setField("statut",e.target.value)}><option value="en_attente">En attente</option><option value="en_recherche">En recherche</option><option value="termine">Archivé / validé</option></select></label>
            <label>Nom client<input value={editing.clientNom} onChange={e=>setField("clientNom",e.target.value)}/></label>
            <label>Téléphone<input value={editing.clientTelephone} onChange={e=>setField("clientTelephone",e.target.value)}/></label>
            <label>Immatriculation<input value={editing.immatriculation} onChange={e=>setField("immatriculation",e.target.value.toUpperCase())}/></label>
            <label>VIN / châssis<input maxLength="17" value={editing.vin} onChange={e=>setField("vin",e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}/></label>
            <label>Marque<select value={editing.marque} onChange={e=>setEditing({...editing, marque:e.target.value, modele:""})}><option value="">Sélectionner</option>{CAR_BRANDS.map(m=><option key={m}>{m}</option>)}</select></label>
            <label>Modèle<select value={editing.modele} disabled={!editing.marque} onChange={e=>setField("modele",e.target.value)}><option value="">Sélectionner</option>{(CAR_MODELS[editing.marque]||[]).map(m=><option key={m}>{m}</option>)}</select></label>
            <label>Finition / motorisation<input value={editing.finition} onChange={e=>setField("finition",e.target.value)} placeholder="1.6 HDI, année, finition..."/></label>
          </div>
        </div>

        <div className="panel demande-client">
          <div className="line-title">
            <div><h3>1. Demande rapide du client</h3><p className="muted">Écris seulement la liste donnée par le client. Tu peux enregistrer et revenir plus tard.</p></div>
            <button onClick={preparerRecherche}><ClipboardList/>Préparer la recherche</button>
          </div>
          <textarea className="big-request" value={editing.demandeRapide} onChange={e=>setField("demandeRapide",e.target.value)} placeholder={"Exemple :\nKit embrayage\nKit distribution\nFiltre à air\nFiltre à huile"} />
          <div className="quick-actions horizontal">
            <button className="primary" onClick={saveFiche}><Save/>Mettre de côté / Enregistrer</button>
            <button onClick={()=>setField("demandeRapide","")}><X/>Vider la liste</button>
          </div>
        </div>

        <div className="panel">
          <div className="line-title">
            <div><h3>2. Recherche par pièce</h3><p className="muted">Clique sur une pièce pour remplir proposition 1 et proposition 2 avec références différentes.</p></div>
            <button onClick={()=>{const p=emptyPiece(""); setEditing({...editing,pieces:[...(editing.pieces||[]),p]}); setOpenPieceId(p.id);}}><Plus/>Ajouter pièce</button>
          </div>
          <div className="request-preview">
            {(editing.pieces||[]).map((p,i)=><button key={p.id} className={openPieceId===p.id ? "tab-on":""} onClick={()=>setOpenPieceId(p.id)}>{i+1}. {p.designation || "Pièce sans nom"}</button>)}
          </div>

          {!pieceOuverte ? (
            <div className="waiting-panel"><p>Prépare la recherche ou clique sur “Ajouter pièce”.</p></div>
          ) : (
            <div className="piece-box">
              <div className="piece-head"><b>{pieceOuverte.designation || "Pièce"}</b><button className="danger" onClick={()=>{const rest=(editing.pieces||[]).filter(p=>p.id!==pieceOuverte.id); setEditing({...editing,pieces:rest}); setOpenPieceId(rest[0]?.id || "");}}><Trash2/></button></div>
              <div className="grid2">
                <label>Nom de la pièce<input value={pieceOuverte.designation} onChange={e=>updatePiece(pieceOuverte.id,{designation:e.target.value})}/></label>
                <label>Remarque<input value={pieceOuverte.remarque || ""} onChange={e=>updatePiece(pieceOuverte.id,{remarque:e.target.value})}/></label>
              </div>

              <div className="two-proposals">
                {(pieceOuverte.propositions || [propositionEmpty(1), propositionEmpty(2)]).slice(0,2).map((pr,idx)=>(
                  <div className={`simple-proposal ${(pr.selectionnee || pr.retenue) ? "selected-proposal":""}`} key={pr.id || idx}>
                    <div className="proposal-head">
                      <b>Proposition {idx+1}</b>
                      <label className="radio-choice"><input type="checkbox" checked={!!(pr.selectionnee || pr.retenue)} onChange={(e)=>togglePropSelection(pieceOuverte.id,idx,e.target.checked)}/>Afficher</label>
                    </div>
                    <div className="grid2">
                      <label>Référence proposition {idx+1}<input value={pr.reference || ""} onChange={e=>updateProp(pieceOuverte.id,idx,{reference:e.target.value})}/></label>
                      <label>Marque / fournisseur<input value={pr.marque || ""} onChange={e=>updateProp(pieceOuverte.id,idx,{marque:e.target.value})}/></label>
                      <label>Prix<input type="number" value={pr.prix || ""} onChange={e=>updateProp(pieceOuverte.id,idx,{prix:e.target.value})}/></label>
                      <label>Note<input value={pr.note || ""} onChange={e=>updateProp(pieceOuverte.id,idx,{note:e.target.value})} placeholder="France, étranger, délai..."/></label>
                    </div>

                    <div className="image-line proposition-image-line">
                      {pr.image ? <img src={pr.image}/> : <div className="empty-img"><ImagePlus/>Image référence {idx+1}</div>}
                      <label className="upload"><ImagePlus/>Ajouter image référence {idx+1}<input type="file" accept="image/*" onChange={e=>e.target.files?.[0] && imageToBase64Prop(e.target.files[0], pieceOuverte.id, idx)}/></label>
                      {pr.image && <button className="danger" onClick={()=>updateProp(pieceOuverte.id, idx, { image: "" })}><Trash2/>Retirer image</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bottom-actions">
          <button onClick={cancel}><X/>Retour</button>
          <button onClick={()=>printFiche(editing)}><Printer/>Imprimer fiche technique</button>
          <button onClick={validerArchive}><CheckCircle2/>Valider archive</button>
          <button className="primary" onClick={saveFiche}><Save/>Archiver / Enregistrer</button>
        </div>
      </div>
    </section>
  );
}

function printFiche(f) {
  const pieces = (f.pieces || []).length ? f.pieces : splitPieces(f.demandeRapide).map(n => emptyPiece(n));

  function rowsForProposal(index) {
    return pieces.map((p, i) => {
      const prop = (p.propositions || [])[index] || {};
      const selected = !!(prop.selectionnee || prop.retenue);
      return `<tr class="${selected ? "selected-row" : "not-selected-row"}">
        <td class="col-num">${i + 1}</td>
        <td class="piece-name">${p.designation || ""}</td>
        <td class="ref-cell">${prop.reference || ""}</td>
        <td class="image-cell">${prop.image ? `<img class="ref-img" src="${prop.image}">` : `<span class="no-img">—</span>`}</td>
        <td>${prop.marque || ""}</td>
        <td>${prop.note || ""}</td>
        <td class="price-cell">${money(prop.prix)}</td>
        <td class="select-cell">${selected ? "Oui" : "Non"}</td>
      </tr>`;
    }).join("");
  }

  const total1 = totalProposition(f, 0);
  const total2 = totalProposition(f, 1);
  const grandTotal = total1 + total2;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Fiche technique ${f.numero}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            background: #ffffff;
            font-size: 12px;
          }

          .page {
            width: 100%;
            min-height: 100%;
            border: 1px solid #d9e1f2;
            border-radius: 14px;
            overflow: hidden;
          }

          .top {
            display: grid;
            grid-template-columns: 1.2fr .8fr;
            gap: 18px;
            padding: 16px 18px;
            background: linear-gradient(135deg, #071b4b, #12347c);
            color: white;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .brand img {
            width: 76px;
            height: 76px;
            object-fit: contain;
            background: white;
            border-radius: 16px;
            padding: 6px;
          }

          .brand h1 {
            margin: 0;
            font-size: 25px;
            letter-spacing: .5px;
          }

          .brand p {
            margin: 5px 0 0;
            color: #e7ecff;
            font-size: 13px;
            font-weight: 700;
          }

          .contact {
            text-align: right;
            line-height: 1.6;
            font-size: 12px;
            color: #f7f9ff;
          }

          .title-bar {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            padding: 13px 18px;
            border-bottom: 3px solid #d4a21c;
            background: #f7f9ff;
          }

          .title-bar h2 {
            margin: 0;
            color: #071b4b;
            font-size: 19px;
          }

          .status-pill {
            background: #fff3cd;
            border: 1px solid #d4a21c;
            color: #5a4300;
            border-radius: 999px;
            padding: 7px 11px;
            font-size: 12px;
            font-weight: 800;
          }

          .main-info {
            padding: 14px 18px 8px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 9px;
          }

          .info-box {
            border: 1px solid #d9e1f2;
            border-radius: 12px;
            padding: 9px 10px;
            background: #ffffff;
            min-height: 54px;
          }

          .info-box label {
            display: block;
            color: #667085;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .4px;
            margin-bottom: 4px;
            font-weight: 800;
          }

          .info-box strong {
            color: #071b4b;
            font-size: 13px;
            line-height: 1.3;
            font-weight: 800;
            word-break: break-word;
          }

          .info-box.wide {
            grid-column: span 2;
          }

          .note {
            margin: 12px 18px;
            padding: 10px 12px;
            background: #fff9e8;
            border: 1px solid #edd17a;
            border-radius: 12px;
            color: #4f3a00;
            font-weight: 700;
          }

          .section {
            padding: 8px 18px 0;
          }

          .section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 10px 0 7px;
          }

          .section-head h3 {
            margin: 0;
            color: #071b4b;
            font-size: 16px;
          }

          .section-total {
            background: #071b4b;
            color: white;
            border-radius: 10px;
            padding: 7px 10px;
            font-size: 13px;
            font-weight: 900;
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid #d9e1f2;
            border-radius: 12px;
            font-size: 11px;
          }

          th {
            background: #071b4b;
            color: white;
            padding: 8px 7px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .3px;
          }

          td {
            border-top: 1px solid #e5eaf5;
            padding: 7px;
            vertical-align: middle;
          }

          .selected-row {
            background: #f3fff7;
          }

          .not-selected-row {
            background: #f4f5f7;
            color: #747b87;
          }

          .col-num {
            width: 32px;
            text-align: center;
            font-weight: 900;
            color: #071b4b;
          }

          .piece-name {
            font-weight: 900;
            color: #071b4b;
          }

          .ref-cell {
            font-weight: 800;
          }

          .price-cell {
            font-weight: 900;
            color: #000;
            white-space: nowrap;
          }

          .select-cell {
            font-weight: 900;
            text-align: center;
          }

          .image-cell {
            width: 86px;
            text-align: center;
          }

          .ref-img {
            width: 74px;
            height: 54px;
            object-fit: cover;
            border: 1px solid #d9e1f2;
            border-radius: 9px;
            background: white;
          }

          .no-img {
            color: #98a2b3;
            font-weight: 800;
          }

          .summary {
            margin: 14px 18px 16px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .summary-card {
            border-radius: 14px;
            padding: 12px;
            text-align: center;
            border: 1px solid #d9e1f2;
            background: #f7f9ff;
          }

          .summary-card label {
            display: block;
            color: #667085;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 5px;
          }

          .summary-card strong {
            color: #071b4b;
            font-size: 18px;
            font-weight: 900;
          }

          .summary-card.grand {
            background: #071b4b;
            border-color: #071b4b;
          }

          .summary-card.grand label,
          .summary-card.grand strong {
            color: white;
          }

          .footer {
            margin: 0 18px 10px;
            padding-top: 8px;
            border-top: 1px solid #d4a21c;
            text-align: center;
            color: #667085;
            font-size: 11px;
            font-weight: 700;
          }

          @media print {
            .page { border-radius: 0; }
          }
        </style>
      </head>

      <body>
        <div class="page">
          <div class="top">
            <div class="brand">
              <img src="${logo}">
              <div>
                <h1>${ENTREPRISE.nom}</h1>
                <p>Fiche technique interne — Archive magasin</p>
              </div>
            </div>
            <div class="contact">
              📞 ${ENTREPRISE.telFixe}<br>
              🟢 ${ENTREPRISE.whatsapp}<br>
              ✉️ ${ENTREPRISE.email}<br>
              📍 ${ENTREPRISE.adresse}
            </div>
          </div>

          <div class="title-bar">
            <h2>Fiche de recherche pièces — ${f.numero}</h2>
            <div class="status-pill">${f.archiveValidee ? "Archivé" : "Non archivé"}</div>
          </div>

          <div class="main-info">
            <div class="info-grid">
              <div class="info-box">
                <label>Date</label>
                <strong>${f.date || ""}</strong>
              </div>
              <div class="info-box">
                <label>Salarié</label>
                <strong>${f.creeParNom || ""}</strong>
              </div>
              <div class="info-box">
                <label>Client</label>
                <strong>${f.clientNom || ""}</strong>
              </div>
              <div class="info-box">
                <label>Téléphone</label>
                <strong>${f.clientTelephone || ""}</strong>
              </div>
              <div class="info-box">
                <label>Immatriculation</label>
                <strong>${f.immatriculation || ""}</strong>
              </div>
              <div class="info-box">
                <label>VIN / Châssis</label>
                <strong>${f.vin || ""}</strong>
              </div>
              <div class="info-box wide">
                <label>Véhicule</label>
                <strong>${[f.marque,f.modele,f.finition].filter(Boolean).join(" ")}</strong>
              </div>
            </div>
          </div>

          <div class="note">
            Document interne pour archive magasin. Ce document n’est pas un devis client.
          </div>

          <div class="section">
            <div class="section-head">
              <h3>Proposition 1</h3>
              <div class="section-total">Total : ${money(total1)}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Pièce</th>
                  <th>Référence</th>
                  <th>Image</th>
                  <th>Marque / fournisseur</th>
                  <th>Note</th>
                  <th>Prix</th>
                  <th>Sélection</th>
                </tr>
              </thead>
              <tbody>${rowsForProposal(0)}</tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-head">
              <h3>Proposition 2</h3>
              <div class="section-total">Total : ${money(total2)}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Pièce</th>
                  <th>Référence</th>
                  <th>Image</th>
                  <th>Marque / fournisseur</th>
                  <th>Note</th>
                  <th>Prix</th>
                  <th>Sélection</th>
                </tr>
              </thead>
              <tbody>${rowsForProposal(1)}</tbody>
            </table>
          </div>

          <div class="summary">
            <div class="summary-card">
              <label>Total proposition 1</label>
              <strong>${money(total1)}</strong>
            </div>
            <div class="summary-card">
              <label>Total proposition 2</label>
              <strong>${money(total2)}</strong>
            </div>
            <div class="summary-card grand">
              <label>Total sélectionné</label>
              <strong>${money(grandTotal)}</strong>
            </div>
          </div>

          <div class="footer">
            ${ENTREPRISE.nom} — ${ENTREPRISE.adresse} — ${ENTREPRISE.email}
          </div>
        </div>

        <script>window.print()</script>
      </body>
    </html>
  `);
  win.document.close();
}

createRoot(document.getElementById("root")).render(<App />);
