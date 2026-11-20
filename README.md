# Cerveau

Mon second cerveau, selon la méthode **PARA** : capturer vite, trier, agir, revoir chaque semaine.
Une appli web installable (téléphone et ordinateur), hébergée sur GitHub Pages.

Les notes ne sont **pas** dans ce dépôt : ce sont de simples fichiers Markdown rangés dans un **dépôt privé** séparé, lu et écrit directement depuis l'appli avec un jeton GitHub. Ce dépôt-ci ne contient que le code.

## Organisation des notes (dépôt privé)

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

Icône réglages → **Propriétaire**, **Dépôt** (le dépôt privé des notes), **Branche**, **Jeton**.

Jeton : GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens. Accès au seul dépôt des notes, permission **Contents : Read and write**.

## Synchro

- À l'ouverture, au retour sur l'appli, quelques secondes après chaque modification.
- Un commit par lot de modifications (API Git de GitHub) : l'historique permet de revenir en arrière.
- Si une même note est modifiée sur deux appareils, les deux versions sont gardées.
- Hors ligne, tout fonctionne ; les modifications partent au retour du réseau.

## Capturer depuis le téléphone

- Bouton ＋ de l'appli, ou appui long sur l'icône → « Capturer ».
- **Partager → Cerveau** depuis n'importe quelle appli (Android, appli installée).
- Sur ordinateur : touche `N` pour capturer, `/` pour chercher, `Ctrl + Entrée` pour valider, `Ctrl + S` pour enregistrer une note.
