# Cadence, par Hémistiches

Direction juridique externalisée et de transition : présentation, tarifs et test d'orientation : https://cadence.hemistiches.com

Deux pages, française (`index.html`) et anglaise (`en/index.html`), reliées par le sélecteur FR | EN de l'en-tête. Chacune contient les deux modes d'intervention, les tarifs, la FAQ, le test, les mentions légales et la politique de confidentialité ; toute modification de texte se reporte dans les deux fichiers.

**Les prix et les règles de calcul sont centralisés dans `regles.js`**, chargé par les deux pages : grille externalisée et transition, taux horaire, plancher journalier, seuils de durée (3 et 6 mois), report, pondérations du test et orientation. Les montants affichés dans les pages (`data-p`) sont recalculés depuis ce fichier au chargement ; une modification de prix se fait donc là, et nulle part ailleurs. Aucune compilation ni dépendance : ce que contient ce dépôt est exactement ce qui est publié.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | La version française (textes, test, calcul, mentions légales et confidentialité) |
| `regles.js` | Tarifs, seuils et logique d'orientation du test, communs aux deux pages |
| `en/index.html` | La version anglaise, même barème et même formulaire ; les mentions indiquent que la version française prévaut |
| `netlify.toml` | Configuration de publication Netlify |
| `robots.txt` | Autorise l'indexation |
| `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png` | Icônes reprises de hemistiches.com |

## Test d'orientation

Trois décisions séparées : le mode (externalisée, transition, proposition personnalisée ou dossier ponctuel), le volume récurrent (estimé en jours par mois à partir de situations concrètes, jamais choisi par le prospect) et la durée, qui fixe le tarif. Le retard accumulé et les opérations exceptionnelles sont signalés à part et n'augmentent pas le forfait ; une durée incertaine affiche les scénarios sans appliquer le tarif le plus bas.

Champs transmis par le formulaire `rapport-cadence` : email, opposition, cadence, charge, orientation, priorites, secteur, effectif, duree, horodatage, version_information.

## Publication

Toute modification enregistrée sur la branche `main` est publiée automatiquement par Netlify (projet `cadence-hemistiches-site`), en une minute environ.

Le formulaire `rapport-cadence` est reçu par Netlify Forms ; une notification est envoyée à chaque demande.

© 2026 Hémistiches. Tous droits réservés. Les textes, la structure du test et les éléments graphiques de ce site sont protégés ; leur reproduction sans autorisation écrite préalable est interdite.
