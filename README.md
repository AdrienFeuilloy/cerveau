# Cerveau

Mon second cerveau, selon la méthode **PARA** : capturer vite, trier, agir, revoir chaque semaine.
Une appli web installable (téléphone et ordinateur), hébergée sur GitHub Pages.

Les notes ne sont **pas** dans ce dépôt : ce sont de simples fichiers Markdown rangés dans le dossier `Cerveau/` d'un **dépôt privé**, lu et écrit directement depuis l'appli avec un jeton GitHub. Ce dépôt-ci ne contient que le code.

## Organisation des notes (dossier `Cerveau/` du dépôt privé)

| Dossier | Contenu |
|---|---|
| `0-Boite/` | Boîte de réception : ce qui est capturé vite, à trier |
| `1-Projets/` | Objectifs avec une fin (`type: projet`, `statut`, `echeance`) |
| `2-Domaines/` | Ce qui dure : Perso, Salarié, PhantStudio… |
| `3-Ressources/` | À garder pour plus tard (sous-dossiers libres) |
| `4-Archives/` | Projets finis, notes qui ne servent plus |
| `Journal/` | Une note par jour (`AAAA-MM-JJ.md`) |

- En-tête YAML : `domaine` (Perso, Salarié ou PhantStudio), `type`, `statut`, `echeance`, `cree`, `modifie`.
- Tâches : `- [ ] texte 📅 AAAA-MM-JJ`, cochées `- [x] texte ✅ AAAA-MM-JJ` (format du module Tasks d'Obsidian).
- Liens : `[[Titre d'une note]]` ; renommer une note met à jour les liens.
- Le dépôt privé peut être ouvert tel quel comme coffre Obsidian.

## Réglages (une fois par appareil)

Icône réglages → **Propriétaire**, **Dépôt** (le dépôt privé), **Branche**, **Dossier** (`Cerveau`), **Jeton**. Cerveau garde sa propre connexion : il ne lit ni ne partage le jeton des autres applis du même site.

Jeton : GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens. Accès au seul dépôt des notes, permission **Contents : Read and write**.

## Synchro

- À l'ouverture, au retour sur l'appli, quelques secondes après chaque modification.
- Un commit par lot de modifications (API Git de GitHub) : l'historique permet de revenir en arrière.
- Si une même note est modifiée sur deux appareils, les deux versions sont gardées.
- Hors ligne, tout fonctionne ; les modifications partent au retour du réseau.

## Capturer depuis le téléphone

- Bouton ＋ de l'appli, ou appui long sur l'icône → « Capturer ».
- **Partager → Cerveau** depuis n'importe quelle appli (Android, appli installée) : textes, liens et photos.
- Bouton 📷 Photo dans « Capturer » (appareil photo ou galerie).

Les photos sont réduites (1600 px, JPEG) puis rangées dans `Cerveau/Fichiers/`, et insérées dans la note avec `![[nom.jpg]]` (format Obsidian). Elles partent dans le même commit que la note.
- Sur ordinateur : touche `N` pour capturer, `/` pour chercher, `Ctrl + Entrée` pour valider, `Ctrl + S` pour enregistrer une note.

## Confier une note à l'assistant

Bouton **◆ Confier à l'assistant** dans une note (ou case « Pour l'assistant » à la capture). L'en-tête de la note reçoit :

```yaml
assistant: à traiter
consigne: Fais-en un plan
demande: 2026-11-20
```

Traitement : la réponse est ajoutée sous `## Réponse de l'assistant`, puis l'en-tête passe à `assistant: fait` avec `traite: AAAA-MM-JJ`. Les notes à traiter apparaissent dans « Aujourd'hui » et dans le compteur du bloc d'état.

## Discuter avec l'IA

Bouton 💬 en haut (ou « Discuter avec l'IA » sur ordinateur) : une discussion avec Claude, en direct.

- **Clé API** : à créer sur console.anthropic.com → API Keys, puis à saisir dans les réglages de Cerveau. Elle reste sur l'appareil, comme le jeton. Un plafond de dépense mensuel se règle sur la console.
- **Modèle** : Haiku 5.5 par défaut (le plus économe), Sonnet 5.5 ou Opus 5.5 au choix dans les réglages.
- **Ce que l'IA voit** : les titres des notes et les tâches ouvertes. Elle ouvre une note ou cherche dans les notes quand elle en a besoin.
- **Ce qu'elle peut faire** : ranger une nouvelle note dans la Boîte (avec `source: IA` dans l'en-tête), seulement si tu le demandes. Elle ne modifie ni ne supprime aucune note.
- **Coût** : affiché sous la discussion. La discussion reste sur l'appareil ; « Nouvelle discussion » repart de zéro (automatique après 6 h).
- **Dans un fil de tâche** : bouton **◆ Réponse de l'IA**. L'IA lit la tâche, sa note et tout le fil, puis répond directement dans le fil (message `· assistant`). Le fil garde la discussion, sur tous les appareils.
- **Dans une note ou un projet** : bouton **💬 En discuter avec l'IA**, qui ouvre la discussion avec la note jointe.
- **◆ Analyser** sur un rendez-vous de l'agenda ouvre la discussion avec ce rendez-vous.

## Polices

Les touches « HUD » utilisent Share Tech Mono et Orbitron (licence SIL Open Font License, fichiers dans `fonts/`), hébergées avec l'appli : aucune requête vers un service externe.

## Fils de discussion

Toucher une étape (tâche) ouvre son **fil** : une discussion attachée à cette étape. Au premier message, la tâche reçoit un identifiant `🆔 abc123` (format du module Tasks d'Obsidian) et le fil devient une note du dossier `Fils/` :

```yaml
fil: abc123
parent: "[[Note de l'étape]]"
tache: Texte de l'étape
```

Messages : `### AAAA-MM-JJ HH:MM · moi` ou `### AAAA-MM-JJ HH:MM · assistant`, suivis du texte. La case « Demander à l'assistant » marque le fil `assistant: à traiter`.

## Questionnaires

Dans un fil ou une note, des questions à remplir depuis l'appli :

```
?? Question à choix unique [un: A ; B ; C]
=>
?? Plusieurs choix possibles [plusieurs: A ; B ; C]
=>
?? Oui ou non ? [oui/non]
=>
?? Un nombre [nombre]
=>
?? Une date [date]
=>
?? Réponse libre
=>
```

Les réponses s'écrivent sur la ligne `=>` (retours à la ligne notés ` ⏎ `). Le bouton « Réponses prêtes » confie la note à l'assistant.

## Organisation de l'appli (v2)

- **Aujourd'hui** : bloc d'état, pastilles des autres applis (menu de Violette, projets PhantStudio), agenda du jour, ce qui est à faire aujourd'hui, boîte à trier, projets en cours.
- **Agenda** : les 3 prochaines semaines jour par jour, rendez-vous Google et échéances de projets seulement. Bouton « Récap day » sur l'accueil : popup condensée (rendez-vous, à faire, retards, projets de la semaine).
- **À faire** : uniquement des actions à cocher, **par date** ou **par projet** (et domaines), plus l'historique des tâches faites.
- **Boîte** : ce qui a été capturé et attend d'être trié.
- **Notes** : ce qu'on garde (idées, ressources, domaines, notes de projets, journal, archives).

## Liens avec les autres applis (même dépôt privé, lecture seule)

- `JSON_VIOLETTE.json` : menu du jour de Violette.
- `data.json` : projets PhantStudio en cours et heures de la semaine.
- `JSON_AGENDA.json` : agenda Google (voir ci-dessous).

## Agenda Google et notifications

Un automate GitHub Actions du dépôt privé (`.github/workflows/cerveau.yml`) tourne 4 fois par jour (7 h 43, 12 h 13, 17 h 13 et 21 h 13, heure de Paris en hiver) :

1. il lit l'adresse iCal secrète de l'agenda (secret `CAL_ICS_URL`), ne garde que **titre et heure** (jamais lieu, description ni invités), **chiffre les titres** (AES-GCM, clé `CAL_KEY`) et écrit `JSON_AGENDA.json` ; la même clé est saisie dans les réglages de l'appli, sur chaque appareil, pour déchiffrer ;
2. il envoie les notifications (Web Push, clé `VAPID_PRIVATE`) aux appareils abonnés (`JSON_PUSH.json`) : résumé du matin vers 7 h 45, et rappels `⏰ AAAA-MM-JJ HH:MM` ou rendez-vous seulement s'ils tombent près d'un passage. L'automate copie aussi les projets en cours qui ont une échéance dans l'agenda Google « Cerveau » (un événement « journée » le jour de l'échéance ; secrets `GCAL_*`).

« ◆ Analyser » sur un rendez-vous crée une note dans la boîte, confiée à l'assistant : c'est le seul moment où un titre est écrit en clair.

## Connexion sur un nouvel appareil

**Login simple.** Réglages → « Activer le login » (depuis un appareil déjà relié) : on choisit un identifiant et un mot de passe propres à Cerveau (12 caractères ou plus). Le jeton (et, au choix, la clé de l'agenda) est chiffré avec eux (PBKDF2 600 000 itérations + AES-GCM) et publié dans `acces.json`, à la racine de ce dépôt. Seul le chiffré est public. Le jeton doit avoir accès en écriture au dépôt `cerveau` pour publier ce fichier. Sur un nouvel appareil, on ouvre l'appli, on saisit identifiant et mot de passe, c'est tout. Ce login ne connecte que Cerveau : les autres applis ont chacune le leur.

**Lien de connexion (variante).** Même chiffrement, mais dans un lien `…/cerveau/#connexion=…` au lieu d'un fichier publié. La partie après `#` n'est jamais envoyée à un serveur.

En cas de nouveau jeton GitHub, réactiver le login (ou recréer le lien).

## Trois sortes de choses

- **Tâche** : une ligne à cocher, rangée dans son domaine (Perso, Salarié, PhantStudio) ou dans un projet. Pas besoin de créer un projet pour une seule action. Une tâche peut avoir des détails : on la touche pour ouvrir son fil, ou on la relie à une note.
- **Projet** : seulement quand il y a plusieurs étapes et une fin.
- **Note** : ce qu'on veut garder (idée, recette, lien, info).

L'onglet Notes ne montre que les notes à garder (le plus récent en haut, filtre par domaine, recherche partout), avec le journal et les archives repliés. Projets et domaines vivent dans « À faire ». Le tri de la boîte pose une seule question : tâche, note ou projet ? Chaque note a un bouton « En faire une tâche ». Le crayon au bout de chaque tâche (ou un appui sur sa date) permet de changer son texte, sa date, ou de la supprimer avec son fil. Les dossiers PARA restent en place pour Obsidian.
