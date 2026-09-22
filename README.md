# Les six prédictions

Six cartes à prédictions, empilées faces en bas, **en français ou en anglais**.

Un toucher retourne la carte du dessus et montre sa prédiction ; un second la fait sortir du cadre et découvre la suivante. Les six cartes sorties, l'écran reste vide — deux touchers rapprochés remettent le paquet.
Une PWA mono-page, 100 % hors-ligne, pilotée au doigt, au clavier ou avec une télécommande de présentation.

## Écrire les prédictions

Tout le texte est dans **[`src/content/cartes.ts`](src/content/cartes.ts)** : une entrée par carte, dans l'ordre. La première du tableau est celle du dessus du paquet.

```ts
{
	entete: { fr: 'Première prédiction', en: 'First prediction' },
	texte: { fr: 'Le sept de cœur', en: 'The seven of hearts' },
},
```

| Champ | Rôle |
| --- | --- |
| `texte` | **Obligatoire.** La prédiction, écrite à la main au dos de la carte |
| `entete` | Une petite ligne au-dessus, plus discrète : une date, un nom, un numéro |

**Deux langues.** Chaque champ s'écrit soit une seule fois (le même dans les deux langues : un nombre, un nom propre), soit une fois par langue : `{ fr: '…', en: '…' }`. Une traduction oubliée ou vide fait échouer `npm test`, comme un champ mal orthographié. Le texte du menu, lui, est dans [`src/content/interface.ts`](src/content/interface.ts).

La taille du texte s'adapte à la carte : il rétrécit juste ce qu'il faut pour ne jamais déborder. Une prédiction longue reste lisible, mais **une prédiction courte frappe plus fort**.

Les textes livrés avec cette version sont du **lorem ipsum** : ils sont là pour montrer la mise en page, et attendent les vraies prédictions.

## Utilisation

| Geste | Effet |
| --- | --- |
| **Toucher** n'importe où, carte face cachée | La carte du dessus se retourne et montre sa prédiction |
| **Toucher** à nouveau | La carte sort du cadre ; la suivante est dessous |
| **Deux touchers rapprochés**, écran vide | Le paquet revient au complet, faces en bas |
| **Appui de 3 s** n'importe où | Menu |

Le toucher compte partout sur l'écran, pas seulement sur la carte : il n'y a pas de zone à viser en scène.

Les gestes sont réglés pour un vrai doigt : un toucher peut durer jusqu'à 0,8 s et bouger de 40 px. Un doigt qui glisse ne fait rien, et un appui relâché entre 0,8 s et 3 s non plus — on peut abandonner un appui long sans retourner de carte. Pendant qu'une carte se retourne ou sort, un nouveau toucher est ignoré un quart de seconde : deux touchers un peu vifs ne font jamais disparaître une prédiction avant que le public l'ait vue.

**Un toucher isolé sur l'écran vide ne fait rien.** Il faut deux touchers rapprochés pour remettre le paquet : un doigt posé par mégarde à la fin de la routine ne fait pas réapparaître les prédictions devant le public.

| Touche (clavier ou télécommande) | Effet |
| --- | --- |
| → ↓ Espace Entrée Page suivante | Toucher la carte du dessus |
| R ou Début | Remettre le paquet, faces en bas |
| Échap ou M | Menu |

### Les cartes

Les prédictions sont écrites **à la main**, à l'encre bleu-noir sur un papier crème. L'app ne télécharge aucune police : elle prend la meilleure police manuscrite déjà installée sur l'appareil (`Bradley Hand` et `Noteworthy` sur iPhone et iPad, `Segoe Script` ou `Ink Free` sur Windows, à défaut l'écriture manuscrite du système). L'aspect varie donc un peu d'un appareil à l'autre — c'est le prix du hors-ligne intégral.

Le **dos des cartes** se choisit dans le menu : bleu, rouge ou encre. Les cartes du dessous sont légèrement décalées et inclinées, comme un vrai paquet posé à plat ; au-delà de la troisième, la pile n'épaissit plus.

### Français ou anglais

Tout est traduit : les prédictions, le menu et l'aide. La langue se choisit **dans le menu** (`FR` / `EN`) et le choix est enregistré comme les autres réglages. À la toute première ouverture, l'app suit la langue du téléphone : anglais s'il est en anglais, français sinon. « Rétablir les réglages par défaut » y revient.

Le **menu** (appui de 3 s, ou Échap / M) permet d'aller directement à une carte, de remettre le paquet, de choisir la langue et le dos des cartes, et de masquer la jauge de l'appui long — à faire avant de jouer si le public voit l'écran. Le numéro de version de l'app (celui du [journal des versions](CHANGELOG.md)) est affiché sous le titre du menu ; le bas du menu détaille ce qui est vraiment installé sur le téléphone — « 0.1.0 — build 1 (abc1234) », le build étant le nombre de commits — ainsi que l'état du maintien de l'écran allumé et le nom du cache hors-ligne.

Juste après l'ouverture du menu par l'appui long, les touchers dans le menu sont ignorés un court instant : le doigt qui se relève ne clique pas sur le bouton placé dessous.

### Écran toujours allumé

Deux moyens actifs en même temps, relancés à chaque toucher et à chaque retour au premier plan : l'API Screen Wake Lock et une vidéo muette invisible jouée en boucle. La vidéo reste active même quand l'API répond : sur iPhone avant iOS 18.4, dans l'app installée sur l'écran d'accueil, l'API accepte la demande sans garder l'écran allumé. Le menu indique « Screen Wake Lock API + vidéo muette en boucle » quand les deux tournent.

**L'app s'ouvre toujours sur un paquet neuf** : elle est prête à jouer à chaque fois, même après une routine laissée en cours. L'état du paquet n'est gardé que le temps de la session, pour qu'un rechargement de la page (mise à jour installée, onglet rouvert par le système) ne recommence jamais la routine en plein milieu. Les réglages, eux, sont enregistrés sur l'appareil et **conservés quand l'app se met à jour** : une mise à jour ne remplace que le cache hors-ligne. L'app demande aussi au navigateur un stockage persistant, pour qu'il ne les efface pas de lui-même ; le menu en affiche l'état (« Stockage »).

### Toujours en portrait

Sur Android, l'app installée verrouille l'orientation. Sur iPhone, une page web ne peut pas le faire : quand le téléphone passe en paysage, l'app pivote tout son affichage pour rester dans l'axe du téléphone. Touchers, appui long et défilement du menu suivent le téléphone, pas l'écran. Sur ordinateur, rien ne pivote.

## Installation

L'app doit être servie en HTTPS (GitHub Pages convient ; tous les chemins sont relatifs). Ouvrez la page une fois en ligne pour que le service worker mette tout en cache, puis :

- **iOS** : Safari → Partager → *Sur l'écran d'accueil*.
- **Android** : Chrome → menu → *Installer l'application*.

Sur iPhone, l'app installée a son propre stockage, séparé de Safari : **ouvrez-la une fois depuis l'écran d'accueil avec du réseau**, pour qu'elle se mette en cache. Ensuite elle démarre sans réseau.

### Vérifier sur le téléphone avant de jouer

1. **Hors-ligne** : ouvrir l'app installée avec du réseau, ouvrir le menu (appui de 3 s) et vérifier que « Cache hors-ligne » affiche un nom `six-predictions-…`. Fermer l'app (la faire glisser vers le haut dans le sélecteur d'apps), passer en mode avion, la rouvrir, jouer les six cartes et remettre le paquet.
2. **Écran allumé** : dans Réglages → Luminosité et affichage → Verrouillage automatique, choisir 30 secondes. Ouvrir l'app, toucher une fois l'écran, puis ne plus y toucher pendant 2 minutes : l'écran ne doit ni baisser ni s'éteindre. Refaire le test en mode économie d'énergie, qui peut couper la vidéo. Remettre ensuite le verrouillage automatique habituel.
3. **Portrait** : tourner le téléphone dans les deux sens ; l'affichage reste dans l'axe du téléphone et les touchers continuent de retourner les cartes.
4. **L'écriture** : vérifier que les prédictions s'affichent bien en écriture manuscrite, et qu'aucune ne déborde de sa carte.
5. **Version** : après une publication, rouvrir l'app avec du réseau, la fermer et la rouvrir : le bas du menu doit afficher le nouveau numéro de build et un nouveau nom de cache, et les réglages (langue, dos des cartes) doivent être restés les mêmes. L'app doit s'ouvrir sur un paquet neuf.

## Publication

**Chaque push sur `main` met l'app à jour** (https://dezande.github.io/six-predictions/). Tout passe par une pull request : GitHub Actions y vérifie les types, lance les tests unitaires, compile, puis teste l'app compilée dans Chrome ; sans CI verte, pas de fusion. Après la fusion, `main` ne refait pas ces vérifications — la branche devait être à jour avec `main` et la fusion se fait en rebase, donc `main` porte exactement l'arbre déjà testé — elle construit et déploie sur GitHub Pages.

Le nom du cache hors-ligne est une empreinte de tous les fichiers de `dist/`, **numéro de version compris** : chaque nouvelle version change ce nom, même si seul le numéro a changé, et les téléphones retéléchargent tout ; l'ancien cache est supprimé. Seuls les caches de cette app sont supprimés : les autres apps publiées sur `dezande.github.io` (même origine, donc mêmes caches) ne sont pas touchées.

Une nouvelle version s'installe dès que l'app est ouverte avec du réseau. Si personne n'a touché l'écran depuis l'ouverture, l'app se recharge aussitôt ; sinon elle garde la version en cours jusqu'à l'ouverture suivante : jamais de rechargement en pleine routine.

```sh
npm run deploy              # vérifie en local, ouvre la pull request, suit GitHub Actions et contrôle le site
npm run deploy -- --complet # en rejouant aussi les tests dans Chrome en local
npm run deploy -- --dry-run # vérifications et build seulement, sans push
```

## Journal des versions

Chaque changement se note dans le [journal des versions](CHANGELOG.md), sous « Non publié », dans le commit qui le porte : la vérification du kit (`npm run check:changelog`) contrôle la forme du journal et refuse un changement qui ne s'explique pas, en pull request comme sur `main`. Les versions nommées (tags git `vX.Y.Z` et Releases GitHub) y sont décrites une par une.

## Développement

Il faut Node 24 (version figée dans `.nvmrc` : `nvm use`). TypeScript et Sass servent uniquement au build : l'app publiée n'a aucune dépendance.

Le code commun aux accessoires de scène (écran allumé, portrait, hors-ligne et mises à jour, build, déploiement, pilotage de Chrome) vient du kit **[kit-scene](https://github.com/dezande/kit-scene)**, sous-module git monté dans `src/kit/`. L'app utilise une version précise du kit ; pour prendre la dernière, voir le README du kit.

```sh
git submodule update --init   # après un clone : récupère le kit
npm install
npm run serve       # build puis serveur local sur http://localhost:8000
npm test            # tests unitaires (quelques secondes)
npm run test:e2e    # tests dans Chrome de l'app compilée (environ 30 s, après npm run build)
npm run typecheck   # vérification des types
npm run check:changelog # le journal des versions a-t-il été mis à jour ?
npm run build       # génère dist/
```

Organisation de `src/` : voir le commentaire en tête de [`src/app.ts`](src/app.ts).

### Tests

- **Tests unitaires** (`tests/logic/`) : la logique pure de `src/logic/` sous Node — l'état du paquet (retournement, sortie, remise en place, état relu abîmé), les gestes avec des rythmes lents et hésitants, les touches, les réglages, les langues — et la validité du contenu de `src/content/cartes.ts` et `src/content/interface.ts` dans les deux langues.
- **Tests dans Chrome** (`tests/e2e/app.e2e.ts`) : l'app compilée dans Chrome sans interface, sur un écran de téléphone simulé, avec de vrais événements tactiles et clavier. La routine entière jusqu'à l'écran vide, le toucher isolé qui ne fait rien et le double toucher qui remet le paquet, deux touchers vifs, le toucher hors de la carte, la reprise du paquet au rechargement et les données abîmées, le clavier, l'appui de 3 s et le menu (aller à une carte, remettre le paquet, langue, dos des cartes, réglages par défaut), aucune prédiction qui déborde dans les deux langues et téléphone tourné, et le fonctionnement hors-ligne.
- Les outils communs sont dans `tests/e2e/helpers.ts`. Il faut Google Chrome, trouvé automatiquement (sinon, indiquez son chemin dans `CHROME_PATH`).
- Le calcul du nom de cache au build, la vérification du build, le serveur local et les calculs de rotation sont testés dans le kit.

### Icônes

L'icône est dessinée dans [`src/icon/icon.svg`](src/icon/icon.svg) : trois cartes en éventail, celle du dessus retournée. Les deux PNG de `public/icons/` en sont rendus avec Chrome sans interface, à refaire après chaque modification du dessin :

```sh
for size in 192 512; do
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
		--screenshot="public/icons/icon-$size.png" --window-size=$size,$size \
		"file://$PWD/src/icon/icon.svg"
done
```
