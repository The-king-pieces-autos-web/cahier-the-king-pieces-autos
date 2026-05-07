V29 - CORRECTIF RECHARGEMENT ZERO

Problème corrigé :
- Tu créais une fiche/devis, puis après actualisation le site revenait à zéro.
- Cause probable : app_state vide/ancien reprenait la priorité au rechargement.

Correction :
1. Les tables séparées sont maintenant prioritaires au chargement.
2. Le commit écrit directement dans les tables séparées.
3. Si l'écriture Supabase échoue, une alerte s'affiche immédiatement.
4. app_state reste seulement filet de sécurité, il ne doit plus vider le site.

Test :
1. Créer une fiche.
2. Vérifier tkpa_fiches_cahier dans Supabase.
3. Actualiser Ctrl+F5.
4. La fiche doit rester.
