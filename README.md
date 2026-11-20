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

Icône réglages → **Propriétaire**, **Dépôt** (le dépôt privé), **Branche**, **Dossier** (`Cerveau`), **Jeton**. Si un jeton est déjà enregistré pour ce même dépôt sur ce navigateur, il est repris automatiquement.

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
