ÉTAPES SUPABASE + RENDER

1) Supabase > SQL Editor
   Copie le contenu de SUPABASE_SQL_A_COPIER.sql puis clique Run.

2) Supabase > Project Settings > API
   Copie :
   - Project URL
   - Publishable key / anon public key

3) Render > ton Static Site > Environment
   Ajoute :
   VITE_SUPABASE_URL = ton Project URL
   VITE_SUPABASE_PUBLISHABLE_KEY = ta clé Publishable / anon

4) Render > Manual Deploy
   Clique Clear build cache & deploy.

5) Test :
   Ouvre le site sur 2 PC.
   Crée une fiche sur PC 1.
   Elle doit apparaître sur PC 2 après actualisation, et automatiquement si Realtime est activé.
