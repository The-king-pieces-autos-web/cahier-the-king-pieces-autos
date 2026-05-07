CORRECTIF LOCALSTORAGE / IMAGES

Problème corrigé :
- QuotaExceededError : le navigateur était plein à cause des images collées en base64.
- Le site pouvait arrêter d'enregistrer ou afficher une page vide.

Correction :
1. Les sauvegardes locales de sécurité ne dupliquent plus les images.
2. Si LocalStorage est plein, le site nettoie les anciennes sauvegardes lourdes.
3. Si nécessaire, il garde une copie locale allégée sans images.
4. La sauvegarde Supabase reste prioritaire.
5. Bouton ajouté dans Sauvegardes jour :
   "Nettoyer stockage navigateur"

IMPORTANT :
Les images lourdes ne doivent pas être multipliées dans LocalStorage.
La prochaine étape vraiment propre sera Supabase Storage pour stocker les images séparément.
