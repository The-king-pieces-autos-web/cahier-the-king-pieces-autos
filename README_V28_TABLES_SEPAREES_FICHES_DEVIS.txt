V28 - TABLES SEPAREES FICHES / DEVIS

Cette version commence la vraie migration fiable :

- Les utilisateurs sont lus/écrits dans tkpa_users.
- Les fiches cahier salarié sont écrites dans :
  tkpa_fiches_cahier
  tkpa_pieces_fiche
  tkpa_propositions_piece

- Les devis sont écrits dans :
  tkpa_devis_clients
  tkpa_lignes_devis

- L'ancien app_state reste temporairement comme sécurité, mais les données importantes existent maintenant en lignes séparées.

IMPORTANT :
1. Exécuter le SQL des nouvelles tables dans Supabase.
2. Mettre cette version en ligne.
3. Faire Ctrl+F5 sur tous les PC.
4. Créer une fiche test puis vérifier dans Supabase table tkpa_fiches_cahier.
5. Créer un devis test puis vérifier dans tkpa_devis_clients.

Cette version réduit fortement le risque qu'un salarié écrase tout.
