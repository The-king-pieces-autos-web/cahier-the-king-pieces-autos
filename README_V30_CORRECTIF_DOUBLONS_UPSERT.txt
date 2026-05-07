V30 - CORRECTIF DOUBLONS SUPABASE

Erreur corrigée :
ON CONFLICT DO UPDATE command cannot affect row a second time

Cause :
Le site envoyait parfois deux lignes avec le même id dans la même sauvegarde
(exemple : deux propositions, deux pièces ou deux utilisateurs dupliqués).

Correction :
Avant chaque upsert Supabase, les lignes sont dédoublonnées automatiquement.

À faire :
npm install
npm run build
git add .
git commit -m "v30 correctif doublons supabase"
git push --force
