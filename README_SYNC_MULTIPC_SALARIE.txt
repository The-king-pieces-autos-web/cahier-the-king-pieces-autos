CORRECTION SYNCHRONISATION MULTI-PC / SALARIÉ

Problème visé :
Un compte salarié ou un autre PC pouvait envoyer une version vide/ancienne vers Supabase et écraser le cahier global.

Correction :
1. Avant chaque sauvegarde, le site relit Supabase.
2. Il fusionne Supabase + données locales.
3. Il garde les fiches/devis/archives existants.
4. Il bloque les sauvegardes vides.
5. Il garde la version la plus complète d'une fiche/devis si deux PC modifient.
6. Après sauvegarde, il relit Supabase pour réaligner l'écran.

IMPORTANT :
Il faut mettre cette version sur TOUS les PC.
Ensuite sur chaque PC : Ctrl + F5.
Si un PC garde une ancienne version, il peut encore provoquer le problème.
