UTILISATEURS SEPARES DANS SUPABASE

Cette version modifie la gestion des comptes :
- Connexion : lit les utilisateurs depuis tkpa_users si disponible.
- Création utilisateur : insert automatique dans tkpa_users.
- Suppression utilisateur : désactivation actif=false dans tkpa_users.
- Les utilisateurs ne sont plus remplacés par un gros app_state global.

IMPORTANT :
Avant de mettre cette version en ligne, exécuter le SQL :
TKPA_NOUVELLE_ARCHITECTURE_TABLES_SEPAREES.sql

Cette version garde encore le reste du cahier/devis dans app_state.
La migration complète fiches/devis séparés viendra après.
