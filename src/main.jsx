
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive, BookOpen, Car, CheckCircle2, ClipboardList, Clock, Edit3, Euro, Eye,
  FileText, ImagePlus, LogOut, Plus, Printer, Save, Search, Send, Shield,
  Trash2, Users, X
} from "lucide-react";
import "./styles.css";
import logo from "./assets/logo.png";
import hero from "./assets/dashboard-hero.jpeg";
import { hasSupabaseConfig, loadCloudState, saveCloudState, subscribeCloudState, supabase } from "./lib/supabase";

const ENTREPRISE = {
  nom: "THE KING PIECES AUTOS",
  slogan: "Vente toutes marques",
  adresse: "32 avenue Marcel Cachin, 93240 Stains",
  email: "thekingpiecesautos@gmail.com",
  tel: "0184741500",
  whatsapp: "+33650058945",
  tvaNumber: "FR80977631530",
};

const LS_KEY = "tkpa_cahier_pro_v4";
const SESSION_KEY = "tkpa_current_user";
const CLOTURE_HEURE = 19;

const CAR_MODELS = {
  "Peugeot": ["106","107","108","206","207","208","307","308","407","508","2008","3008","5008","Partner","Expert","Boxer"],
  "Renault": ["Clio","Megane","Scenic","Captur","Kadjar","Kangoo","Trafic","Master","Twingo","Laguna","Espace"],
  "Citroën": ["C1","C2","C3","C4","C5","C3 Aircross","C4 Picasso","C5 Aircross","Berlingo","Jumpy","Jumper"],
  "Volkswagen": ["Polo","Golf","Passat","Touran","Tiguan","T-Roc","T-Cross","Caddy","Transporter","Crafter"],
  "Audi": ["A1","A3","A4","A5","A6","Q2","Q3","Q5","Q7"],
  "BMW": ["Série 1","Série 2","Série 3","Série 5","X1","X3","X5"],
  "Mercedes-Benz": ["Classe A","Classe B","Classe C","Classe E","CLA","GLA","GLC","Vito","Sprinter"],
  "Ford": ["Fiesta","Focus","Kuga","C-Max","Mondeo","Transit","Ranger"],
  "Opel": ["Corsa","Astra","Mokka","Insignia","Zafira","Vivaro","Movano"],
  "Fiat": ["500","Panda","Punto","Tipo","Doblo","Ducato"],
  "Toyota": ["Yaris","Auris","Corolla","RAV4","C-HR","Aygo","Hilux"],
  "Nissan": ["Micra","Juke","Qashqai","X-Trail","Note","NV200"],
  "Dacia": ["Sandero","Logan","Duster","Dokker","Lodgy","Jogger"],
  "Autre": ["Modèle à saisir manuellement"]
};
const CAR_BRANDS = Object.keys(CAR_MODELS);

const initialUsers = [
  { id: "admin", nom: "Administrateur", identifiant: "admin", motDePasse: "admin", role: "admin" },
  { id: "mokrane", nom: "Mokrane", identifiant: "mokrane", motDePasse: "admin", role: "admin" },
];

function uid(){ return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function today(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function nowTime(){ const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function money(n){ return `${Number(n || 0).toFixed(2)} €`; }
function htFromTtc(ttc){ return Number(ttc || 0) / 1.2; }
function tvaFromTtc(ttc){ return Number(ttc || 0) - htFromTtc(ttc); }
function splitPieces(txt){ return String(txt || "").split(/\n|,|;/).map(x=>x.trim()).filter(Boolean); }
function normalizePlate(v=""){ return String(v).toUpperCase().replace(/[^A-Z0-9]/g,""); }
function isPlateSearch(v=""){ return normalizePlate(v).length >= 5; }
function isSameDay(d, day=today()){ return String(d||"").slice(0,10) === String(day).slice(0,10); }
function vehicleName(f){ return [f.marqueManuelle || f.marque, f.modeleManuel || f.modele, f.finition].filter(Boolean).join(" "); }
function nextNumber(items, prefix){ const y = new Date().getFullYear(); const nums = (items||[]).map(x=>String(x.numero||"")).map(n=>{ const m=n.match(new RegExp(`${prefix}-${y}-(\\d+)`)); return m?Number(m[1]):0; }); return `${prefix}-${y}-${String((nums.length?Math.max(...nums):0)+1).padStart(4,"0")}`; }

function propositionEmpty(num){ return { id: uid(), numero: num, reference: "", marque: "", prix: "", note: "", image: "", selectionnee: num === 1 }; }
function emptyPiece(nom=""){ return { id: uid(), designation: nom, quantite: 1, remarque: "", propositions: [propositionEmpty(1), propositionEmpty(2)] }; }
function selectedProps(p){ const props = p.propositions || []; const sel = props.filter(x => x.selectionnee); return sel.length ? sel : props.slice(0,1); }
function totalFiche(f){ return (f.pieces||[]).reduce((sum,p)=>sum+selectedProps(p).reduce((s,pr)=>s+Number(pr.prix||0)*Number(p.quantite||1),0),0); }

function emptyFiche(user, fiches=[]){
  return {
    id: uid(), numero: nextNumber(fiches, "FICHE"), date: today(), heureCreation: nowTime(),
    source: "sur_place", statut: "en_attente", enregistreCahier: false, envoyeDevis: false,
    clientNom: "", clientTelephone: "", immatriculation: "", vin: "",
    marque: "", modele: "", marqueManuelle: "", modeleManuel: "", finition: "",
    demandeRapide: "", remarque: "", creeParId: user?.id || "", creeParNom: user?.nom || "", pieces: [],
  };
}

function linesFromFiche(f){
  return (f.pieces||[]).flatMap(p=>selectedProps(p).map(pr=>({
    id: `${p.id}-${pr.id}`, designation: p.designation, quantite: Number(p.quantite||1),
    prixTTC: Number(pr.prix||0), note: pr.note || ""
  })));
}
function emptyDevisFromFiche(f, devis=[]){
  return {
    id: uid(), ficheId: f.id, numero: nextNumber(devis,"DEV"), date: today(), heureCreation: nowTime(),
    clientNom: f.clientNom, clientTelephone: f.clientTelephone, immatriculation: f.immatriculation,
    vin: f.vin, vehicule: vehicleName(f), creeParId: f.creeParId, creeParNom: f.creeParNom,
    lignes: linesFromFiche(f), remarque: f.remarque || ""
  };
}
function totalDevis(d){ return (d.lignes||[]).reduce((s,l)=>s+Number(l.quantite||1)*Number(l.prixTTC||0),0); }

function normalizeState(raw){
  return {
    users: Array.isArray(raw?.users) && raw.users.length ? raw.users : initialUsers,
    fiches: Array.isArray(raw?.fiches) ? raw.fiches : [],
    devis: Array.isArray(raw?.devis) ? raw.devis : [],
    archivesJour: Array.isArray(raw?.archivesJour) ? raw.archivesJour : [],
    lastClosureDate: raw?.lastClosureDate || "",
  };
}
function loadState(){ try{ const x=localStorage.getItem(LS_KEY); if(x) return normalizeState(JSON.parse(x)); }catch{} return normalizeState({}); }
function saveLocal(data){ localStorage.setItem(LS_KEY, JSON.stringify(normalizeState(data))); }
async function saveCloud(data){ if(!hasSupabaseConfig) return; await saveCloudState(normalizeState(data)); }
function saveSession(u){ localStorage.setItem(SESSION_KEY, JSON.stringify({ id:u.id, identifiant:u.identifiant, nom:u.nom, role:u.role, motDePasse:u.motDePasse })); }
function loadSession(users=[]){ try{ const s=JSON.parse(localStorage.getItem(SESSION_KEY)||"null"); if(!s) return null; return users.find(u=>u.id===s.id) || users.find(u=>u.identifiant===s.identifiant) || s; }catch{return null;} }
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

function buildDailyArchive(data, dateValue=today()){
  const fiches = data.fiches.filter(f=>f.date === dateValue);
  const devis = data.devis.filter(d=>d.date === dateValue);
  return {
    id: `ARCH-${dateValue}`, date: dateValue, createdAt: new Date().toISOString(),
    fiches: JSON.parse(JSON.stringify(fiches)),
    devis: JSON.parse(JSON.stringify(devis)),
    resume: data.users.map(u=>({
      userId:u.id, nom:u.nom,
      fiches:fiches.filter(f=>f.creeParId===u.id).length,
      devis:devis.filter(d=>d.creeParId===u.id).length,
      total:devis.filter(d=>d.creeParId===u.id).reduce((s,d)=>s+totalDevis(d),0)
    }))
  };
}
function closeDay(data, dateValue=today()){
  const arch = buildDailyArchive(data, dateValue);
  const archivesJour = data.archivesJour.some(a=>a.date===dateValue) ? data.archivesJour.map(a=>a.date===dateValue?arch:a) : [arch, ...data.archivesJour];
  return { ...data, archivesJour, lastClosureDate: dateValue, fiches: data.fiches.map(f=>f.date===dateValue?{...f, archiveJourId:arch.id}:f), devis: data.devis.map(d=>d.date===dateValue?{...d, archiveJourId:arch.id}:d) };
}
function shouldAutoClose(data){ const d = new Date(); return d.getHours() >= CLOTURE_HEURE && data.lastClosureDate !== today(); }

function downloadJsonFile(filename, payload){
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function readJsonFile(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)); }
      catch(e){ reject(e); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function isRechercheTerminee(fiche){
  const pieces = fiche.pieces || [];
  if (!pieces.length) return false;
  return pieces.every((p) => {
    const props = selectedProps(p);
    return p.designation && props.length && props.every((pr) => pr.prix);
  });
}


function Header({title, subtitle}){ return <div className="header"><h1>{title}</h1><p>{subtitle}</p></div>; }

function App(){
  const [data, setData] = useState(()=>normalizeState(loadState()));
  const [currentUser, setCurrentUser] = useState(()=>loadSession(loadState().users));
  const [login, setLogin] = useState({ identifiant:"", motDePasse:"" });
  const [active, setActive] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [editing, setEditing] = useState(null);
  const [openPieceId, setOpenPieceId] = useState("");
  const [preview, setPreview] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(null);
  const [editingDevis, setEditingDevis] = useState(null);
  const [userForm, setUserForm] = useState({ nom:"", identifiant:"", motDePasse:"", role:"salarie" });
  const [syncStatus, setSyncStatus] = useState(hasSupabaseConfig ? "Connexion Supabase..." : "Mode local");
  const lastSaveRef = useRef(0);

  useEffect(()=>{
    let cancelled=false;
    async function start(){
      if(!hasSupabaseConfig){ setSyncStatus("Mode local"); return; }
      try{
        const cloud=await loadCloudState();
        if(cancelled) return;
        const clean=cloud?normalizeState(cloud):normalizeState(loadState());
        if(!cloud) await saveCloudState(clean);
        setData(clean); saveLocal(clean);
        const su=loadSession(clean.users); if(su) setCurrentUser(su);
        setSyncStatus("Synchronisé Supabase");
      }catch(e){ console.error(e); setSyncStatus("Erreur Supabase"); }
    }
    start();
    const ch = subscribeCloudState((next)=>{
      if(Date.now()-lastSaveRef.current<800) return;
      const clean=normalizeState(next); setData(clean); saveLocal(clean);
      const su=loadSession(clean.users); if(su) setCurrentUser(su);
      setSyncStatus("Mise à jour reçue");
    });
    return ()=>{ cancelled=true; if(ch&&supabase) supabase.removeChannel(ch); };
  },[]);

  useEffect(()=>{ if(currentUser) setSelectedUserId(currentUser.role==="admin"?"all":currentUser.id); },[currentUser?.id]);
  useEffect(()=>{ if(shouldAutoClose(data)) commit(closeDay(data, today())); },[data.fiches.length, data.devis.length]);

  function commit(next){
    const clean=normalizeState(next); lastSaveRef.current=Date.now(); setData(clean); saveLocal(clean);
    saveCloud(clean).then(()=>setSyncStatus(hasSupabaseConfig?"Sauvegardé et synchronisé":"Sauvegardé local")).catch(e=>{ console.error(e); setSyncStatus("Erreur sauvegarde Supabase"); });
  }
  async function restoreFullBackup(file){
    if(!file) return;
    if(!confirm("Restaurer cette sauvegarde générale ? Les données actuelles seront remplacées.")) return;
    try{
      const json = await readJsonFile(file);
      const clean = normalizeState(json);
      commit(clean);
      alert("Sauvegarde restaurée avec succès.");
    }catch(e){
      console.error(e);
      alert("Fichier de sauvegarde invalide.");
    }
  }

  function exportFullBackup(){
    const payload = normalizeState(data);
    downloadJsonFile(`sauvegarde-generale-cahier-pro-${today()}-${nowTime().replace(":","h")}.json`, payload);
  }

  function connect(e){
    e.preventDefault();
    const u=data.users.find(x=>x.identifiant.toLowerCase()===login.identifiant.trim().toLowerCase() && x.motDePasse===login.motDePasse);
    if(!u) return alert("Identifiant ou mot de passe incorrect.");
    setCurrentUser(u); saveSession(u);
  }
  function newFiche(){ const f=emptyFiche(currentUser,data.fiches); setEditing(f); setOpenPieceId(""); setActive("edition"); }
  function saveFiche(fiche=editing, msg=true){
    let f={...fiche,enregistreCahier:true};
    if(!f.demandeRapide && !(f.pieces||[]).length && !f.immatriculation && !f.vin && !f.clientNom) return alert("Ajoute au minimum une demande, une plaque, un VIN ou un nom.");

    // Si le salarié clique "Mettre en attente", le statut reste en_attente.
    // Sinon, dès que la recherche contient des pièces avec prix, le statut passe automatiquement en Réalisé.
    if(f.statut !== "en_attente" && isRechercheTerminee(f)){
      f = {...f, statut:"realise"};
    }

    const fiches=data.fiches.some(x=>x.id===f.id)?data.fiches.map(x=>x.id===f.id?f:x):[f,...data.fiches];
    commit({...data,fiches}); setEditing(f); if(msg) alert(f.statut==="realise" ? "Devis enregistré comme réalisé." : "Enregistré dans le cahier.");
  }
  function sendToDevis(fiche=editing){
    const f={...fiche,statut:"realise",enregistreCahier:true,envoyeDevis:true};
    if(!linesFromFiche(f).length) return alert("Ajoute au minimum une pièce avec un prix sélectionné.");
    const dev=emptyDevisFromFiche(f,data.devis);
    const fiches=data.fiches.some(x=>x.id===f.id)?data.fiches.map(x=>x.id===f.id?f:x):[f,...data.fiches];
    commit({...data,fiches,devis:[dev,...data.devis]});
    setEditing(f); setActive("devis"); alert("Envoyé dans la partie Devis.");
  }

  function saveDevisClient(dev){
    if(!dev) return;
    const devis = data.devis.map((d) => d.id === dev.id ? dev : d);
    commit({...data, devis});
    setEditingDevis(null);
    alert("Devis modifié.");
  }

  function deleteDevisClient(devId){
    if(!confirm("Supprimer ce devis ?")) return;
    commit({...data, devis:data.devis.filter((d)=>d.id!==devId)});
  }
  function canEdit(f){ return currentUser?.role==="admin" || f.creeParId===currentUser?.id; }
  function canDelete(){ return currentUser?.role==="admin"; }

  const visibleFiches = useMemo(()=>{
    const q=search.trim().toLowerCase(), plateQ=normalizePlate(search), plateMode=currentUser?.role!=="admin" && isPlateSearch(search);
    return data.fiches
      .filter(f=>{
        const todayMode = !q;
        if(todayMode && f.date !== today()) return false;
        if(currentUser?.role==="admin") return selectedUserId==="all" || f.creeParId===selectedUserId;
        if(f.creeParId===currentUser?.id) return true;
        return plateMode && normalizePlate(f.immatriculation).includes(plateQ);
      })
      .filter(f=>{
        if(!q) return true;
        if(currentUser?.role!=="admin" && f.creeParId!==currentUser?.id) return normalizePlate(f.immatriculation).includes(plateQ);
        const txt=[f.numero,f.clientNom,f.clientTelephone,f.immatriculation,f.vin,vehicleName(f),f.creeParNom,f.demandeRapide,...(f.pieces||[]).flatMap(p=>[p.designation,...(p.propositions||[]).flatMap(pr=>[pr.reference,pr.marque,pr.prix])])].join(" ").toLowerCase();
        return txt.includes(q);
      });
  },[data.fiches,search,selectedUserId,currentUser]);

  const visibleDevis = useMemo(()=>{
    const q=search.trim().toLowerCase();
    return data.devis
      .filter(d=>q || d.date===today())
      .filter(d=>currentUser?.role==="admin" || d.creeParId===currentUser?.id)
      .filter(d=>!q || [d.numero,d.clientNom,d.clientTelephone,d.immatriculation,d.vin,d.vehicule,...(d.lignes||[]).map(l=>l.designation)].join(" ").toLowerCase().includes(q));
  },[data.devis,search,currentUser]);

  if(!currentUser){
    return <div className="login-page"><div className="login-card"><div className="brand"><img src={logo}/><div><h1>{ENTREPRISE.nom}</h1><p>Cahier Pro synchronisé</p></div></div><form onSubmit={connect} className="login-form"><label>Identifiant<input value={login.identifiant} onChange={e=>setLogin({...login,identifiant:e.target.value})}/></label><label>Mot de passe<input type="password" value={login.motDePasse} onChange={e=>setLogin({...login,motDePasse:e.target.value})}/></label><button className="primary full">Connexion</button></form></div></div>;
  }

  const statsByUser=data.users.map(u=>{ const fiches=data.fiches.filter(f=>f.creeParId===u.id && isSameDay(f.date)); const devis=data.devis.filter(d=>d.creeParId===u.id && isSameDay(d.date)); return {user:u,fiches:fiches.length,realise:fiches.filter(f=>f.statut==="realise").length,devis:devis.length,total:devis.reduce((s,d)=>s+totalDevis(d),0)}; });

  return <div className="app">
    <aside>
      <div className="side-brand"><img src={logo}/><b>{ENTREPRISE.nom}</b><small>{currentUser.nom} · {currentUser.role==="admin"?"Administrateur":"Salarié"}</small><small className="sync-status">{syncStatus}</small></div>
      <nav>
        <button className={active==="dashboard"?"on":""} onClick={()=>setActive("dashboard")}><BookOpen/>Tableau de bord</button>
        <button className={active==="cahier"?"on":""} onClick={()=>setActive("cahier")}><Archive/>Cahier Pro</button>
        <button onClick={newFiche}><Plus/>Nouvelle demande</button>
        <button className={active==="devis"?"on":""} onClick={()=>setActive("devis")}><FileText/>Devis</button>
        <button className={active==="sauvegardes"?"on":""} onClick={()=>setActive("sauvegardes")}><ClipboardList/>Sauvegardes jour</button>
        {currentUser.role==="admin"&&<button className={active==="users"?"on":""} onClick={()=>setActive("users")}><Users/>Utilisateurs</button>}
        <button onClick={()=>{clearSession();setCurrentUser(null);}}><LogOut/>Déconnexion</button>
      </nav>
    </aside>
    <main>
      {active==="dashboard"&&<section>
        <div className="hero" style={{backgroundImage:`linear-gradient(90deg, rgba(7,21,60,.92), rgba(7,21,60,.55)), url(${hero})`}}><div><h1>Cahier Pro</h1><p>Demandes en attente, recherches réalisées, envoi vers devis client et sauvegarde journalière à 19h.</p><button className="primary" onClick={newFiche}><Plus/>Nouvelle demande</button></div></div>
        {currentUser.role==="admin"?<><div className="stats"><div><Clock/><b>{data.fiches.filter(f=>f.statut==="en_attente"&&isSameDay(f.date)).length}</b><span>En attente</span></div><div><Edit3/><b>{data.fiches.filter(f=>f.statut==="en_cours"&&isSameDay(f.date)).length}</b><span>En cours</span></div><div><CheckCircle2/><b>{data.fiches.filter(f=>f.statut==="realise"&&isSameDay(f.date)).length}</b><span>Réalisés</span></div><div><Euro/><b>{money(data.devis.filter(d=>isSameDay(d.date)).reduce((s,d)=>s+totalDevis(d),0))}</b><span>Total devis du jour</span></div></div><div className="panel"><h3>Suivi efficacité par salarié aujourd’hui</h3><div className="employee-table"><div className="employee-head"><span>Salarié</span><span>Fiches</span><span>Réalisés</span><span>Devis</span><span>Total</span></div>{statsByUser.map(s=><div className="employee-row" key={s.user.id}><b>{s.user.nom}</b><span>{s.fiches}</span><span>{s.realise}</span><span>{s.devis}</span><span>{money(s.total)}</span></div>)}</div></div></>:<div className="dashboard-grid"><div className="panel"><h3>Mes statistiques aujourd’hui</h3>{(()=>{const f=data.fiches.filter(x=>x.creeParId===currentUser.id&&isSameDay(x.date));const d=data.devis.filter(x=>x.creeParId===currentUser.id&&isSameDay(x.date));return <div className="employee-personal-stats"><div><b>{f.length}</b><span>Mes fiches</span></div><div><b>{f.filter(x=>x.statut==="realise").length}</b><span>Réalisés</span></div><div><b>{d.length}</b><span>Mes devis</span></div><div><b>{money(d.reduce((s,x)=>s+totalDevis(x),0))}</b><span>Total</span></div></div>})()}</div><div className="panel"><h3>Mes demandes à reprendre</h3><ListResume items={data.fiches.filter(f=>f.creeParId===currentUser.id&&f.statut!=="realise"&&isSameDay(f.date)).slice(0,8)} open={(f)=>{setEditing(f);setOpenPieceId(f.pieces?.[0]?.id||"");setActive("edition")}}/></div></div>}
      </section>}

      {active==="cahier"&&<section><Header title="Cahier Pro" subtitle={currentUser.role==="admin"?"Admin : tous les cahiers. Recherche ancienne par plaque, VIN, nom, téléphone ou référence.":"Salarié : ton cahier uniquement. Exception : retrouver une fiche par plaque."}/><div className="toolbar"><div className="search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Recherche plaque, VIN, nom, téléphone..."/></div>{currentUser.role==="admin"?<select value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)}><option value="all">Tous les cahiers</option>{data.users.map(u=><option key={u.id} value={u.id}>Cahier de {u.nom}</option>)}</select>:<div className="locked-filter">Mon cahier</div>}<button className="primary" onClick={newFiche}><Plus/>Nouvelle</button></div><div className="cards">{visibleFiches.map(f=><FicheCard key={f.id} f={f} currentUser={currentUser} canEdit={canEdit(f)} canDelete={canDelete()} open={()=>{setEditing(f);setOpenPieceId(f.pieces?.[0]?.id||"");setActive("edition")}} preview={()=>setPreview(f)} del={()=>{if(confirm("Supprimer ?"))commit({...data,fiches:data.fiches.filter(x=>x.id!==f.id)})}} />)}</div></section>}

      {active==="edition"&&editing&&<Editor editing={editing} setEditing={setEditing} openPieceId={openPieceId} setOpenPieceId={setOpenPieceId} saveFiche={saveFiche} sendToDevis={sendToDevis} setPreview={setPreview} cancel={()=>setActive("cahier")}/>}

      {active==="devis"&&<section><Header title="Devis" subtitle="Devis client imprimable, sans références internes et sans remise."/><div className="toolbar single"><div className="search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Recherche plaque, VIN, nom..."/></div></div><div className="cards">{visibleDevis.map(d=><article className="fiche-card" key={d.id}><div className="card-top"><div><b>{d.numero}</b><small>{d.date} {d.heureCreation} · {d.creeParNom}</small></div><span className="badge realise">Devis client</span></div><h3>{d.clientNom||"Client non renseigné"}</h3><p><Car size={16}/>{d.immatriculation||"Sans plaque"} — {d.vehicule}</p><div className="mini-pieces">{(d.lignes||[]).slice(0,5).map(l=><span key={l.id}>{l.designation} · {money(l.prixTTC)}</span>)}</div><button onClick={()=>printDevisClient(d)}><Printer/>Imprimer devis</button>
                  <button onClick={()=>setEditingDevis(JSON.parse(JSON.stringify(d)))}><Edit3/>Modifier</button>
                  <button className="danger" onClick={()=>deleteDevisClient(d.id)}><Trash2/>Supprimer</button></article>)}</div></section>}

      {active==="sauvegardes"&&<section>
        <Header title="Sauvegardes journalières" subtitle="À 19h, les fiches et devis du jour sont archivés en détail. Tu peux ouvrir chaque dossier quand tu veux."/>
        <div className="panel backup-panel">
          <h3>Sauvegarde générale du site</h3>
          <p className="muted">Cette sauvegarde contient tout : utilisateurs, cahiers, devis, sauvegardes journalières et archives. À faire régulièrement.</p>
          <div className="actions">
            <button className="primary" onClick={exportFullBackup}><Save/>Télécharger sauvegarde générale</button>
            <label className="upload backup-upload"><Archive/>Restaurer une sauvegarde<input type="file" accept="application/json,.json" onChange={(e)=>restoreFullBackup(e.target.files?.[0])}/></label>
          </div>
        </div>
        <div className="actions top-actions"><button className="primary" onClick={()=>commit(closeDay(data,today()))}><Save/>Sauvegarder / clôturer aujourd’hui</button></div>
        <div className="cards">{data.archivesJour.map(a=><article className="fiche-card" key={a.id}><h3>Dossier du {a.date}</h3><p>{a.fiches.length} fiche(s) · {a.devis.length} devis détaillé(s)</p><div className="mini-pieces">{a.resume.map(r=><span key={r.userId}>{r.nom}: {r.fiches} fiches / {r.devis} devis</span>)}</div><div className="actions"><button onClick={()=>setArchiveOpen(a)}><Eye/>Ouvrir le dossier complet</button><button onClick={()=>printArchiveJour(a)}><Printer/>Imprimer résumé</button></div></article>)}</div></section>}

      {active==="users"&&currentUser.role==="admin"&&<section><Header title="Utilisateurs" subtitle="Créer et supprimer les comptes salariés."/><div className="user-grid"><div className="panel"><h3>Créer utilisateur</h3><input placeholder="Nom" value={userForm.nom} onChange={e=>setUserForm({...userForm,nom:e.target.value})}/><input placeholder="Identifiant" value={userForm.identifiant} onChange={e=>setUserForm({...userForm,identifiant:e.target.value})}/><input placeholder="Mot de passe" value={userForm.motDePasse} onChange={e=>setUserForm({...userForm,motDePasse:e.target.value})}/><select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}><option value="salarie">Salarié</option><option value="admin">Admin</option></select><button className="primary" onClick={()=>{if(!userForm.nom||!userForm.identifiant||!userForm.motDePasse)return alert("Remplis tout.");commit({...data,users:[...data.users,{...userForm,id:uid()}]});setUserForm({nom:"",identifiant:"",motDePasse:"",role:"salarie"});}}><Plus/>Ajouter</button></div><div className="panel"><h3>Liste</h3>{data.users.map(u=><div className="user-row" key={u.id}><div><b>{u.nom}</b><small>{u.identifiant} · {u.role} · mot de passe : {u.motDePasse}</small></div>{u.id!==currentUser.id&&<button className="danger" onClick={()=>{if(confirm("Supprimer ?"))commit({...data,users:data.users.filter(x=>x.id!==u.id)})}}><Trash2/>Supprimer</button>}</div>)}</div></div></section>}

      {preview&&<PreviewModal fiche={preview} close={()=>setPreview(null)} send={()=>sendToDevis(preview)}/>}
      {archiveOpen&&<ArchiveModal archive={archiveOpen} close={()=>setArchiveOpen(null)}/>}
      {editingDevis&&<DevisEditModal devis={editingDevis} setDevis={setEditingDevis} save={saveDevisClient} close={()=>setEditingDevis(null)}/>}
    </main>
  </div>;
}

function ListResume({items, open}){ return <div className="today-list">{items.map(f=><button key={f.id} onClick={()=>open(f)}><span><b>{f.immatriculation||f.clientTelephone||"Sans plaque"}</b><small>{f.date} {f.heureCreation} · {f.statut}</small></span><strong>{f.pieces?.length||splitPieces(f.demandeRapide).length} pièce(s)</strong></button>)}</div>; }

function FicheCard({f,currentUser,canEdit,canDelete,open,preview,del}){
  return <article className="fiche-card"><div className="card-top"><div><b>{f.numero}</b><small>{f.date} {f.heureCreation} · {f.creeParNom}</small></div><span className={`badge ${f.statut}`}>{f.statut==="realise"?"Réalisé":f.statut==="en_cours"?"En cours":"En attente"}</span></div><h3>{f.clientNom||"Client non renseigné"}</h3><p><Car size={16}/>{f.immatriculation||"Plaque non renseignée"} — {vehicleName(f)||"Véhicule non renseigné"}</p><div className="mini-pieces">{((f.pieces||[]).length?f.pieces:splitPieces(f.demandeRapide).map(x=>({id:x,designation:x}))).slice(0,5).map(p=><span key={p.id}>{p.designation}</span>)}</div>{currentUser.role!=="admin"&&f.creeParId!==currentUser.id&&<div className="external-warning">Fiche déjà faite par {f.creeParNom}. Consultation par plaque uniquement.</div>}<div className="actions"><button onClick={preview}><Eye/>Consultation détaillée</button>{canEdit&&<button onClick={open}><Edit3/>Ouvrir</button>}{canDelete&&<button className="danger" onClick={del}><Trash2/>Supprimer</button>}</div></article>;
}

function Editor({ editing, setEditing, openPieceId, setOpenPieceId, saveFiche, sendToDevis, setPreview, cancel }){
  const piece=(editing.pieces||[]).find(p=>p.id===openPieceId);
  function setField(k,v){ setEditing({...editing,[k]:v}); }
  function updatePiece(id,patch){ setEditing({...editing,pieces:(editing.pieces||[]).map(p=>p.id===id?{...p,...patch}:p)}); }
  function updateProp(pid,idx,patch){ setEditing({...editing,pieces:(editing.pieces||[]).map(p=>{if(p.id!==pid)return p;const props=[...(p.propositions||[])];props[idx]={...(props[idx]||propositionEmpty(idx+1)),...patch};return {...p,propositions:props};})}); }
  function toggleProp(pid,idx,checked){ updateProp(pid,idx,{selectionnee:checked}); }
  function addProp(pid){ setEditing({...editing,pieces:(editing.pieces||[]).map(p=>p.id===pid?{...p,propositions:[...(p.propositions||[]),propositionEmpty((p.propositions||[]).length+1)]}:p)}); }
  function removeProp(pid,idx){ setEditing({...editing,pieces:(editing.pieces||[]).map(p=>{if(p.id!==pid)return p;if((p.propositions||[]).length<=1){alert("Minimum une proposition.");return p;}return {...p,propositions:p.propositions.filter((_,i)=>i!==idx).map((pr,i)=>({...pr,numero:i+1}))};})}); }
  function imageProp(file,pid,idx){ const r=new FileReader(); r.onload=()=>updateProp(pid,idx,{image:r.result}); r.readAsDataURL(file); }
  function prepare(){ const names=splitPieces(editing.demandeRapide); if(!names.length)return alert("Écris la liste de pièces."); const ex=(editing.pieces||[]).map(p=>p.designation.toLowerCase()); const newP=names.filter(n=>!ex.includes(n.toLowerCase())).map(n=>emptyPiece(n)); const pieces=[...(editing.pieces||[]),...newP]; setEditing({...editing,pieces,statut:"en_cours"}); setOpenPieceId(pieces[0]?.id||""); }
  return <section><Header title="Cahier Pro — recherche" subtitle="Mise en attente sous la demande rapide, puis recherche et envoi vers devis."/><div className="editor"><div className="panel"><h3>Informations client / véhicule</h3><div className="grid2"><label>Numéro<input value={editing.numero} onChange={e=>setField("numero",e.target.value)}/></label><label>Date<input type="date" value={editing.date} onChange={e=>setField("date",e.target.value)}/></label><label>Heure<input value={editing.heureCreation||""} onChange={e=>setField("heureCreation",e.target.value)}/></label><label>Statut<select value={editing.statut} onChange={e=>setField("statut",e.target.value)}><option value="en_attente">En attente</option><option value="en_cours">En cours</option><option value="realise">Réalisé</option></select></label><label>Nom client<input value={editing.clientNom} onChange={e=>setField("clientNom",e.target.value)}/></label><label>Téléphone<input value={editing.clientTelephone} onChange={e=>setField("clientTelephone",e.target.value)}/></label><label>Immatriculation<input value={editing.immatriculation} onChange={e=>setField("immatriculation",e.target.value.toUpperCase())}/></label><label>VIN<input maxLength="17" value={editing.vin} onChange={e=>setField("vin",e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}/></label><label>Marque automatique<select value={editing.marque} onChange={e=>setEditing({...editing,marque:e.target.value,modele:""})}><option value="">Sélectionner</option>{CAR_BRANDS.map(m=><option key={m}>{m}</option>)}</select></label><label>Modèle automatique<select value={editing.modele} disabled={!editing.marque} onChange={e=>setField("modele",e.target.value)}><option value="">Sélectionner</option>{(CAR_MODELS[editing.marque]||[]).map(m=><option key={m}>{m}</option>)}</select></label><label>Marque manuelle<input value={editing.marqueManuelle||""} onChange={e=>setField("marqueManuelle",e.target.value)}/></label><label>Modèle manuel<input value={editing.modeleManuel||""} onChange={e=>setField("modeleManuel",e.target.value)}/></label><label>Finition / motorisation<input value={editing.finition} onChange={e=>setField("finition",e.target.value)}/></label></div></div><div className="panel demande-client"><div className="line-title"><div><h3>Demande rapide</h3><p className="muted">Liste donnée par le client, une pièce par ligne.</p></div><button onClick={prepare}><ClipboardList/>Commencer la recherche</button></div><textarea className="big-request" value={editing.demandeRapide} onChange={e=>setField("demandeRapide",e.target.value)} placeholder={"Kit embrayage\nKit distribution\nFiltre à air\nFiltre à huile"}/><div className="quick-actions"><button className="primary" onClick={()=>saveFiche({...editing,statut:"en_attente"})}><Clock/>Mettre en attente</button><button onClick={()=>setField("demandeRapide","")}><X/>Vider</button></div></div><div className="panel"><div className="line-title"><h3>Recherche détaillée</h3><button onClick={()=>{const p=emptyPiece("");setEditing({...editing,pieces:[...(editing.pieces||[]),p],statut:"en_cours"});setOpenPieceId(p.id)}}><Plus/>Ajouter pièce</button></div><div className="request-preview">{(editing.pieces||[]).map((p,i)=><button key={p.id} className={openPieceId===p.id?"tab-on":""} onClick={()=>setOpenPieceId(p.id)}>{i+1}. {p.designation||"Pièce sans nom"}</button>)}</div>{!piece?<div className="waiting-panel">Clique sur “Commencer la recherche”.</div>:<div className="piece-box"><div className="piece-head"><b>{piece.designation}</b><button className="danger" onClick={()=>{const rest=editing.pieces.filter(p=>p.id!==piece.id);setEditing({...editing,pieces:rest});setOpenPieceId(rest[0]?.id||"")}}><Trash2/></button></div><div className="grid2"><label>Nom pièce<input value={piece.designation} onChange={e=>updatePiece(piece.id,{designation:e.target.value})}/></label><label>Quantité<input type="number" value={piece.quantite||1} onChange={e=>updatePiece(piece.id,{quantite:e.target.value})}/></label></div><div className="line-title proposition-toolbar"><div><h4>Propositions</h4><small>Prix saisi en TTC. Les références ne sortent pas sur le devis client.</small></div><button onClick={()=>addProp(piece.id)}><Plus/>Ajouter proposition</button></div><div className="two-proposals">{(piece.propositions||[]).map((pr,idx)=><div className={`simple-proposal ${pr.selectionnee?"selected-proposal":""}`} key={pr.id}><div className="proposal-head"><b>Proposition {idx+1}</b><div className="proposal-head-actions"><label className="radio-choice"><input type="checkbox" checked={!!pr.selectionnee} onChange={e=>toggleProp(piece.id,idx,e.target.checked)}/>Sélectionner</label>{(piece.propositions||[]).length>1&&<button className="danger" onClick={()=>removeProp(piece.id,idx)}><Trash2/>Supprimer</button>}</div></div><div className="grid2"><label>Référence<input value={pr.reference||""} onChange={e=>updateProp(piece.id,idx,{reference:e.target.value})}/></label><label>Marque / fournisseur<input value={pr.marque||""} onChange={e=>updateProp(piece.id,idx,{marque:e.target.value})}/></label><label>Prix TTC<input type="number" value={pr.prix||""} onChange={e=>updateProp(piece.id,idx,{prix:e.target.value})}/></label><label>Note<input value={pr.note||""} onChange={e=>updateProp(piece.id,idx,{note:e.target.value})}/></label></div><div className="image-line proposition-image-line">{pr.image?<img src={pr.image}/>:<div className="empty-img"><ImagePlus/>Image réf.</div>}<label className="upload"><ImagePlus/>Ajouter image<input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&imageProp(e.target.files[0],piece.id,idx)}/></label>{pr.image&&<button className="danger" onClick={()=>updateProp(piece.id,idx,{image:""})}><Trash2/>Retirer</button>}</div></div>)}</div></div>}</div><div className="bottom-actions"><button onClick={cancel}><X/>Retour</button><button onClick={()=>setPreview(editing)}><Eye/>Consultation détaillée du devis</button><button className="primary" onClick={()=>saveFiche({...editing,statut: isRechercheTerminee(editing) ? "realise" : "en_cours"})}><Save/>Enregistrer dans le cahier</button><button onClick={()=>sendToDevis({...editing,statut:"realise"})}><Send/>Envoyer vers devis</button></div></div></section>;
}

function PreviewModal({fiche, close, send}){
  const total = totalFiche(fiche);
  const pieces = fiche.pieces || [];

  return (
    <div className="modal-back">
      <div className="modal large">
        <div className="modal-header-pro">
          <div>
            <h2>Aperçu professionnel de la recherche</h2>
            <p>Contrôle interne avant enregistrement ou envoi vers devis client.</p>
          </div>
          <button onClick={close}><X/></button>
        </div>

        <div className="preview-pro-top">
          <div className="preview-pro-brand">
            <img src={logo}/>
            <div>
              <b>{ENTREPRISE.nom}</b>
              <span>Fiche de recherche pièces</span>
            </div>
          </div>
          <div className="preview-pro-number">
            <strong>{fiche.numero}</strong>
            <span>{fiche.date} · {fiche.heureCreation}</span>
          </div>
        </div>

        <div className="preview-pro-grid">
          <div className="preview-pro-box">
            <label>Client</label>
            <strong>{fiche.clientNom || "Non renseigné"}</strong>
            <span>{fiche.clientTelephone || "Téléphone non renseigné"}</span>
          </div>
          <div className="preview-pro-box">
            <label>Véhicule</label>
            <strong>{vehicleName(fiche) || "Non renseigné"}</strong>
            <span>Plaque : {fiche.immatriculation || "Non renseignée"} · VIN : {fiche.vin || "Non renseigné"}</span>
          </div>
          <div className="preview-pro-box">
            <label>Salarié</label>
            <strong>{fiche.creeParNom || "Non renseigné"}</strong>
            <span>Statut : {fiche.statut === "realise" ? "Réalisé" : fiche.statut === "en_cours" ? "En cours" : "En attente"}</span>
          </div>
        </div>

        <div className="preview-section-title">
          <h3>Pièces et propositions sélectionnées</h3>
          <b>Total sélectionné : {money(total)}</b>
        </div>

        <div className="preview-piece-list">
          {pieces.map((p, index) => (
            <div className="preview-piece-card" key={p.id}>
              <div className="preview-piece-head">
                <b>{index + 1}. {p.designation || "Pièce sans nom"}</b>
                <span>Quantité : {p.quantite || 1}</span>
              </div>

              <div className="preview-proposals-grid">
                {selectedProps(p).map((pr, i) => (
                  <div className="preview-proposal-card" key={pr.id}>
                    <div className="preview-proposal-title">
                      <b>Proposition {i + 1}</b>
                      <strong>{money(Number(pr.prix || 0) * Number(p.quantite || 1))}</strong>
                    </div>
                    <div className="preview-proposal-details">
                      <span><b>Référence :</b> {pr.reference || "Non renseignée"}</span>
                      <span><b>Marque / fournisseur :</b> {pr.marque || "Non renseigné"}</span>
                      <span><b>Prix TTC unitaire :</b> {money(pr.prix)}</span>
                      <span><b>Note :</b> {pr.note || "—"}</span>
                    </div>
                    {pr.image && <img className="preview-ref-image" src={pr.image}/>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!pieces.length && (
            <div className="preview-empty">
              Aucune pièce détaillée. Commence la recherche pour générer les lignes.
            </div>
          )}
        </div>

        <div className="preview-actions-pro">
          <button onClick={close}><X/>Fermer</button>
          <button className="primary" onClick={send}><Send/>Envoyer vers devis client</button>
        </div>
      </div>
    </div>
  );
}

function ArchiveModal({archive, close}){
  const [tab, setTab] = React.useState("devis");
  const totalDevisJour = (archive.devis || []).reduce((s, d) => s + totalDevis(d), 0);

  return (
    <div className="modal-back">
      <div className="modal archive-modal">
        <div className="modal-header-pro">
          <div>
            <h2>Dossier journalier du {archive.date}</h2>
            <p>Archive complète : fiches du cahier, devis détaillés et résumé par salarié.</p>
          </div>
          <button onClick={close}><X/></button>
        </div>

        <div className="archive-summary-grid">
          <div><b>{archive.fiches?.length || 0}</b><span>Fiches cahier</span></div>
          <div><b>{archive.devis?.length || 0}</b><span>Devis archivés</span></div>
          <div><b>{money(totalDevisJour)}</b><span>Total devis</span></div>
        </div>

        <div className="archive-tabs">
          <button className={tab === "devis" ? "on" : ""} onClick={() => setTab("devis")}>Devis détaillés</button>
          <button className={tab === "fiches" ? "on" : ""} onClick={() => setTab("fiches")}>Fiches cahier</button>
          <button className={tab === "resume" ? "on" : ""} onClick={() => setTab("resume")}>Résumé salariés</button>
        </div>

        {tab === "devis" && (
          <div className="archive-list">
            {(archive.devis || []).map((d) => (
              <div className="archive-devis-card" key={d.id}>
                <div className="archive-devis-head">
                  <div>
                    <b>{d.numero}</b>
                    <span>{d.clientNom || "Client non renseigné"} · {d.immatriculation || "Sans plaque"} · {d.vehicule || ""}</span>
                  </div>
                  <strong>{money(totalDevis(d))}</strong>
                </div>

                <table className="archive-lines-table">
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th>Qté</th>
                      <th>Prix TTC</th>
                      <th>Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.lignes || []).map((l) => (
                      <tr key={l.id}>
                        <td>{l.designation}</td>
                        <td>{l.quantite || 1}</td>
                        <td>{money(l.prixTTC)}</td>
                        <td>{money(Number(l.quantite || 1) * Number(l.prixTTC || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="actions">
                  <button onClick={() => printDevisClient(d)}><Printer/>Imprimer ce devis</button>
                </div>
              </div>
            ))}

            {!(archive.devis || []).length && <div className="preview-empty">Aucun devis dans ce dossier.</div>}
          </div>
        )}

        {tab === "fiches" && (
          <div className="archive-list">
            {(archive.fiches || []).map((f) => (
              <div className="archive-devis-card" key={f.id}>
                <div className="archive-devis-head">
                  <div>
                    <b>{f.numero}</b>
                    <span>{f.clientNom || "Client non renseigné"} · {f.immatriculation || "Sans plaque"} · {f.statut}</span>
                  </div>
                  <strong>{money(totalFiche(f))}</strong>
                </div>
                <div className="mini-pieces">
                  {(f.pieces || []).map((p) => <span key={p.id}>{p.designation}</span>)}
                </div>
              </div>
            ))}

            {!(archive.fiches || []).length && <div className="preview-empty">Aucune fiche dans ce dossier.</div>}
          </div>
        )}

        {tab === "resume" && (
          <div className="employee-table archive-employee-table">
            <div className="employee-head">
              <span>Salarié</span><span>Fiches</span><span>Devis</span><span>Total</span>
            </div>
            {(archive.resume || []).map((r) => (
              <div className="employee-row" key={r.userId}>
                <b>{r.nom}</b><span>{r.fiches}</span><span>{r.devis}</span><span>{money(r.total)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="preview-actions-pro">
          <button onClick={close}><X/>Fermer le dossier</button>
          <button onClick={() => printArchiveJour(archive)}><Printer/>Imprimer résumé</button>
        </div>
      </div>
    </div>
  );
}


function DevisEditModal({devis, setDevis, save, close}){
  function updateLine(id, patch){
    setDevis({...devis, lignes:(devis.lignes||[]).map((l)=>l.id===id?{...l,...patch}:l)});
  }
  function removeLine(id){
    setDevis({...devis, lignes:(devis.lignes||[]).filter((l)=>l.id!==id)});
  }
  function addLine(){
    setDevis({...devis, lignes:[...(devis.lignes||[]), {id:uid(), designation:"", quantite:1, prixTTC:0}]});
  }

  return (
    <div className="modal-back">
      <div className="modal large">
        <div className="modal-header-pro">
          <div>
            <h2>Modifier le devis client</h2>
            <p>Modification autorisée sur les informations visibles au client. Les références ne sont pas imprimées.</p>
          </div>
          <button onClick={close}><X/></button>
        </div>

        <div className="grid2">
          <label>Numéro devis<input value={devis.numero || ""} onChange={(e)=>setDevis({...devis, numero:e.target.value})}/></label>
          <label>Date<input type="date" value={devis.date || ""} onChange={(e)=>setDevis({...devis, date:e.target.value})}/></label>
          <label>Nom client<input value={devis.clientNom || ""} onChange={(e)=>setDevis({...devis, clientNom:e.target.value})}/></label>
          <label>Téléphone<input value={devis.clientTelephone || ""} onChange={(e)=>setDevis({...devis, clientTelephone:e.target.value})}/></label>
          <label>Immatriculation<input value={devis.immatriculation || ""} onChange={(e)=>setDevis({...devis, immatriculation:e.target.value.toUpperCase()})}/></label>
          <label>Véhicule<input value={devis.vehicule || ""} onChange={(e)=>setDevis({...devis, vehicule:e.target.value})}/></label>
        </div>

        <div className="line-title devis-edit-title">
          <h3>Lignes du devis</h3>
          <button onClick={addLine}><Plus/>Ajouter une ligne</button>
        </div>

        <div className="devis-edit-lines">
          {(devis.lignes || []).map((l)=>(
            <div className="devis-edit-row" key={l.id}>
              <input placeholder="Désignation" value={l.designation || ""} onChange={(e)=>updateLine(l.id,{designation:e.target.value})}/>
              <input type="number" placeholder="Qté" value={l.quantite || 1} onChange={(e)=>updateLine(l.id,{quantite:Number(e.target.value || 1)})}/>
              <input type="number" placeholder="Prix TTC" value={l.prixTTC || ""} onChange={(e)=>updateLine(l.id,{prixTTC:Number(e.target.value || 0)})}/>
              <b>{money(Number(l.quantite || 1)*Number(l.prixTTC || 0))}</b>
              <button className="danger" onClick={()=>removeLine(l.id)}><Trash2/></button>
            </div>
          ))}
        </div>

        <div className="preview-total">Total TTC : {money(totalDevis(devis))}</div>

        <div className="preview-actions-pro">
          <button onClick={close}><X/>Annuler</button>
          <button onClick={()=>printDevisClient(devis)}><Printer/>Aperçu impression</button>
          <button className="primary" onClick={()=>save(devis)}><Save/>Enregistrer modification</button>
        </div>
      </div>
    </div>
  );
}

function printDevisClient(d){
  const lignes = d.lignes || [];
  const rows = lignes.map((l, i) => {
    const unitTTC = Number(l.prixTTC || 0);
    const qty = Number(l.quantite || 1);
    const unitHT = htFromTtc(unitTTC);
    const lineTTC = qty * unitTTC;
    const lineHT = qty * unitHT;
    return `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="designation">${l.designation || ""}</td>
        <td class="qty">${qty}</td>
        <td class="price">${money(unitHT)}</td>
        <td class="price">${money(unitTTC)}</td>
        <td class="price total-line">${money(lineTTC)}</td>
      </tr>
    `;
  }).join("");

  const totalTTC = totalDevis(d);
  const totalHT = htFromTtc(totalTTC);
  const totalTVA = tvaFromTtc(totalTTC);

  const w = window.open("", "_blank");
  w.document.write(`
    <html>
      <head>
        <title>${d.numero}</title>
        <style>
          @page {
            size: A4;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

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
          }

          .header {
            display: grid;
            grid-template-columns: 1.2fr .8fr;
            gap: 20px;
            align-items: start;
            padding-bottom: 14px;
            border-bottom: 4px solid #0b2f73;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .brand img {
            width: 72px;
            height: 72px;
            object-fit: contain;
          }

          .brand h1 {
            margin: 0;
            font-size: 26px;
            color: #0b2f73;
            letter-spacing: .3px;
          }

          .brand .subtitle {
            margin-top: 4px;
            font-size: 12px;
            color: #334155;
            font-weight: 700;
          }

          .company {
            margin-top: 7px;
            line-height: 1.45;
            color: #334155;
            font-size: 11px;
          }

          .doc-box {
            text-align: right;
          }

          .doc-box h2 {
            margin: 0;
            color: #0b2f73;
            font-size: 32px;
            letter-spacing: 1px;
          }

          .doc-meta {
            margin-top: 10px;
            display: inline-grid;
            gap: 5px;
            text-align: left;
            border: 1px solid #c7d7ef;
            border-radius: 12px;
            padding: 10px 12px;
            background: #f8fbff;
            min-width: 210px;
          }

          .doc-meta div {
            display: flex;
            justify-content: space-between;
            gap: 18px;
          }

          .doc-meta span {
            color: #64748b;
            font-weight: 700;
          }

          .doc-meta b {
            color: #0b2f73;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 16px;
          }

          .info-card {
            border: 1px solid #c7d7ef;
            border-radius: 14px;
            overflow: hidden;
            min-height: 112px;
          }

          .info-title {
            background: #f1f6ff;
            color: #0b2f73;
            font-weight: 900;
            padding: 9px 12px;
            border-bottom: 1px solid #c7d7ef;
            font-size: 14px;
          }

          .info-body {
            padding: 11px 12px;
            display: grid;
            gap: 6px;
            line-height: 1.35;
          }

          .line {
            display: grid;
            grid-template-columns: 110px 1fr;
            gap: 8px;
          }

          .line span {
            color: #64748b;
            font-weight: 800;
          }

          .line b {
            color: #111827;
          }

          .details {
            margin-top: 16px;
            border: 1px solid #c7d7ef;
            border-radius: 14px;
            overflow: hidden;
          }

          .details-title {
            background: #f1f6ff;
            color: #0b2f73;
            font-size: 15px;
            font-weight: 900;
            padding: 10px 12px;
            border-bottom: 1px solid #c7d7ef;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          th {
            background: #0b2f73;
            color: #ffffff;
            text-align: left;
            padding: 10px 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .25px;
          }

          td {
            border-bottom: 1px solid #d8e2f3;
            border-right: 1px solid #d8e2f3;
            padding: 9px 8px;
            vertical-align: middle;
          }

          tr:last-child td {
            border-bottom: none;
          }

          td:last-child,
          th:last-child {
            border-right: none;
          }

          .num {
            width: 42px;
            text-align: center;
            color: #0b2f73;
            font-weight: 900;
          }

          .designation {
            font-weight: 700;
            color: #111827;
          }

          .qty {
            width: 70px;
            text-align: center;
            font-weight: 800;
          }

          .price {
            width: 110px;
            text-align: right;
            white-space: nowrap;
            font-weight: 800;
          }

          .total-line {
            color: #000;
            font-weight: 900;
          }

          .bottom-zone {
            display: grid;
            grid-template-columns: 1fr 330px;
            gap: 18px;
            align-items: end;
            margin-top: 22px;
          }

          .note-box {
            border: 1px solid #d8e2f3;
            border-radius: 14px;
            padding: 12px;
            min-height: 95px;
            background: #fbfdff;
            color: #334155;
            line-height: 1.5;
          }

          .note-box b {
            color: #0b2f73;
          }

          .totals {
            border: 1px solid #c7d7ef;
            border-radius: 14px;
            overflow: hidden;
            background: #ffffff;
          }

          .totals-row {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 11px 12px;
            border-bottom: 1px solid #d8e2f3;
            font-weight: 800;
          }

          .totals-row span {
            color: #334155;
          }

          .totals-row b {
            color: #0b2f73;
          }

          .totals-row.grand {
            background: #000000;
            color: #ffffff;
            border-bottom: none;
            font-size: 18px;
            padding: 13px 12px;
          }

          .totals-row.grand span,
          .totals-row.grand b {
            color: #ffffff;
          }

          .conditions {
            margin-top: 18px;
            border-top: 1px solid #d8e2f3;
            padding-top: 10px;
            color: #475569;
            font-size: 11px;
            line-height: 1.45;
          }

          .footer {
            position: fixed;
            bottom: 9mm;
            left: 12mm;
            right: 12mm;
            text-align: center;
            border-top: 3px solid #0b2f73;
            padding-top: 7px;
            color: #475569;
            font-size: 10.5px;
            line-height: 1.45;
          }

          .footer b {
            color: #0b2f73;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <div class="page">
          <div class="header">
            <div class="brand">
              <img src="${logo}">
              <div>
                <h1>${ENTREPRISE.nom}</h1>
                <div class="subtitle">${ENTREPRISE.slogan || "Vente toutes marques"}</div>
                <div class="company">
                  📍 ${ENTREPRISE.adresse}<br>
                  ☎️ ${ENTREPRISE.tel} &nbsp; | &nbsp; WhatsApp ${ENTREPRISE.whatsapp}<br>
                  ✉️ ${ENTREPRISE.email}
                </div>
              </div>
            </div>

            <div class="doc-box">
              <h2>DEVIS</h2>
              <div class="doc-meta">
                <div><span>N°</span><b>${d.numero || ""}</b></div>
                <div><span>Date</span><b>${d.date || ""}</b></div>
                <div><span>Validité</span><b>7 jours</b></div>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <div class="info-title">Client</div>
              <div class="info-body">
                <div class="line"><span>Nom</span><b>${d.clientNom || ""}</b></div>
                <div class="line"><span>Téléphone</span><b>${d.clientTelephone || ""}</b></div>
              </div>
            </div>

            <div class="info-card">
              <div class="info-title">Véhicule</div>
              <div class="info-body">
                <div class="line"><span>Véhicule</span><b>${d.vehicule || ""}</b></div>
                <div class="line"><span>Immat.</span><b>${d.immatriculation || ""}</b></div>
                <div class="line"><span>VIN</span><b>${d.vin || ""}</b></div>
              </div>
            </div>
          </div>

          <div class="details">
            <div class="details-title">Détail du devis</div>
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Désignation</th>
                  <th>Qté</th>
                  <th>Prix HT</th>
                  <th>Prix TTC</th>
                  <th>Total TTC</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>

          <div class="bottom-zone totals-only">
            <div></div>
            <div class="totals">
              <div class="totals-row"><span>Total HT</span><b>${money(totalHT)}</b></div>
              <div class="totals-row"><span>TVA 20%</span><b>${money(totalTVA)}</b></div>
              <div class="totals-row grand"><span>Total TTC</span><b>${money(totalTTC)}</b></div>
            </div>
          </div>

          <div class="conditions">
            Les références restent internes au magasin et ne figurent pas sur le devis client. Les prix sont indiqués TTC, sous réserve de disponibilité des pièces.
          </div>

          <div class="footer">
            <b>${ENTREPRISE.nom}</b> — ${ENTREPRISE.adresse}<br>
            Email : ${ENTREPRISE.email} — Téléphone : ${ENTREPRISE.tel} — WhatsApp : ${ENTREPRISE.whatsapp}<br>
            TVA : ${ENTREPRISE.tvaNumber}
          </div>
        </div>

        <script>window.print()</script>
      </body>
    </html>
  `);
  w.document.close();
}function printArchiveJour(a){
  const resumeRows = (a.resume || []).map(r=>`
    <tr>
      <td>${r.nom}</td>
      <td>${r.fiches}</td>
      <td>${r.devis}</td>
      <td>${money(r.total)}</td>
    </tr>
  `).join("");

  const devisRows = (a.devis || []).map(d=>`
    <tr>
      <td>${d.numero}</td>
      <td>${d.clientNom || ""}</td>
      <td>${d.immatriculation || ""}</td>
      <td>${(d.lignes || []).map(l=>`${l.designation} x${l.quantite || 1}`).join("<br>")}</td>
      <td>${money(totalDevis(d))}</td>
    </tr>
  `).join("");

  const fichesRows = (a.fiches || []).map(f=>`
    <tr>
      <td>${f.numero}</td>
      <td>${f.clientNom || ""}</td>
      <td>${f.immatriculation || ""}</td>
      <td>${(f.pieces || []).map(p => {
        const refs = selectedProps(p).map(pr => pr.reference ? `Réf: ${pr.reference}` : "").filter(Boolean).join(" / ");
        return `${p.designation}${refs ? " — " + refs : ""}`;
      }).join("<br>")}</td>
      <td>${f.statut || ""}</td>
    </tr>
  `).join("");

  const totalJour = (a.devis || []).reduce((s,d)=>s+totalDevis(d),0);

  const w = window.open("", "_blank");
  w.document.write(`
    <html>
      <head>
        <title>Résumé journée ${a.date}</title>
        <style>
          @page{size:A4;margin:12mm}
          body{font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:12px}
          .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #0b2f73;padding-bottom:12px}
          .brand{display:flex;gap:12px;align-items:center}
          .brand img{width:70px;height:70px;object-fit:contain}
          h1{margin:0;color:#0b2f73;font-size:24px}
          h2{color:#0b2f73;margin:18px 0 8px;font-size:18px}
          .meta{text-align:right;color:#334155;line-height:1.5}
          .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
          .card{border:1px solid #c7d7ef;border-radius:12px;padding:12px;text-align:center;background:#f8fbff}
          .card b{display:block;color:#0b2f73;font-size:20px;margin-bottom:4px}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th{background:#0b2f73;color:white;text-align:left;padding:8px;font-size:11px}
          td{border:1px solid #d8e2f3;padding:7px;vertical-align:top}
          .footer{position:fixed;bottom:9mm;left:12mm;right:12mm;text-align:center;border-top:3px solid #0b2f73;padding-top:7px;color:#475569;font-size:10.5px}
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <img src="${logo}">
            <div>
              <h1>${ENTREPRISE.nom}</h1>
              <div>Résumé journalier détaillé</div>
            </div>
          </div>
          <div class="meta">
            <b>Date :</b> ${a.date}<br>
            <b>Généré le :</b> ${today()} ${nowTime()}
          </div>
        </div>

        <div class="summary">
          <div class="card"><b>${(a.fiches || []).length}</b>Fiches cahier</div>
          <div class="card"><b>${(a.devis || []).length}</b>Devis client</div>
          <div class="card"><b>${money(totalJour)}</b>Total devis</div>
        </div>

        <h2>Résumé par salarié</h2>
        <table>
          <thead><tr><th>Salarié</th><th>Fiches</th><th>Devis</th><th>Total devis</th></tr></thead>
          <tbody>${resumeRows}</tbody>
        </table>

        <h2>Devis détaillés</h2>
        <table>
          <thead><tr><th>N° devis</th><th>Client</th><th>Plaque</th><th>Lignes</th><th>Total TTC</th></tr></thead>
          <tbody>${devisRows}</tbody>
        </table>

        <h2>Fiches cahier avec références</h2>
        <table>
          <thead><tr><th>N° fiche</th><th>Client</th><th>Plaque</th><th>Pièces / références</th><th>Statut</th></tr></thead>
          <tbody>${fichesRows}</tbody>
        </table>

        <div class="footer">${ENTREPRISE.nom} — ${ENTREPRISE.adresse} — ${ENTREPRISE.email}</div>
        <script>window.print()</script>
      </body>
    </html>
  `);
  w.document.close();
}

createRoot(document.getElementById("root")).render(<App />);
