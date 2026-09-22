# Les six prédictions

Six cartes à prédictions, empilées faces en bas, **en français ou en anglais**.

Un toucher retourne la carte du dessus et montre sa prédiction ; un second la fait sortir du cadre et découvre la suivante. Les six cartes sorties, l'écran reste vide — deux touchers rapprochés remettent le paquet.
Une PWA mono-page, 100 % hors-ligne, pilotée au doigt, au clavier ou avec une télécommande de présentation.

## Écrire les prédictions

Tout le texte est dans **[`src/content/cartes.ts`](src/content/cartes.ts)** : une entrée par carte, dans l'ordre. La première du tableau est celle du dessus du paquet.

```ts
{ texte: 'NO!' },
{ texte: 'THIS\nONE\nYES!' },
{ texte: { fr: 'Le sept de cœur', en: 'The seven of hearts' } },
```

| Champ | Rôle |
| --- | --- |
| `texte` | **Obligatoire.** La prédiction, écrite à la main sur la carte |
| `entete` | Une petite ligne au-dessus, plus discrète : une date, un nom, un numéro. Facultatif, et aucune des six cartes actuelles ne s'en sert |

**Deux langues.** Chaque champ s'écrit soit une seule fois (le même dans les deux langues : un nombre, un nom propre, une interjection), soit une fois par langue : `{ fr: '…', en: '…' }`. Une traduction oubliée ou vide fait échouer `npm test`, comme un champ mal orthographié. Le texte du menu, lui, est dans [`src/content/interface.ts`](src/content/interface.ts).

### Comment la prédiction est mise en page

**Elle remplit la carte.** Sa taille est calculée pour occuper toute la place disponible : un mot court frappe plein cadre, un texte long rétrécit juste ce qu'il faut. Rien à régler.

**Les plus longues sont écrites en diagonale.** La diagonale d'une carte est bien plus longue que sa largeur : quand un mot y gagne au moins 12 %, il est tracé en biais, d'un coin à l'autre. Un mot court reste d'aplomb — l'incliner ne le grandirait pas, seulement le rendrait moins lisible. Un texte sur plusieurs lignes reste toujours droit.

**Les lignes ne sont jamais coupées toutes seules.** C'est un retour à la ligne (`\n`) dans le texte qui décide où ça casse, et rien d'autre : `'THIS\nONE\nYES!'` donne un mot par ligne.

**Chaque prédiction est soulignée** d'un trait tracé à la main, de la même encre et de la même grosseur que les lettres — parfois deux traits, parfois ondulé. Le soulignement suit le mot, y compris en diagonale.

## Utilisation

| Geste | Effet |
| --- | --- |
| **Toucher** n'importe où, carte face cachée | La carte du dessus se retourne et montre sa prédiction |
| **Toucher** à nouveau | La carte sort du cadre ; la suivante attend à sa place, un peu plus bas |
| **Deux touchers rapprochés**, écran vide | Le paquet revient au complet, faces en bas, dans un nouvel étalement |
| **Appui de 3 s** n'importe où | Menu |

Le toucher compte partout sur l'écran, pas seulement sur la carte : il n'y a pas de zone à viser en scène.

Les gestes sont réglés pour un vrai doigt : un toucher peut durer jusqu'à 0,8 s et bouger de 40 px. Un doigt qui glisse ne fait rien, et un appui relâché entre 0,8 s et 3 s non plus — on peut abandonner un appui long sans retourner de carte. Pendant qu'une carte se retourne ou sort, un nouveau toucher est ignoré un quart de seconde : deux touchers un peu vifs ne font jamais disparaître une prédiction avant que le public l'ait vue.

**Un toucher isolé sur l'écran vide ne fait rien.** Il faut deux touchers rapprochés pour remettre le paquet : un doigt posé par mégarde à la fin de la routine ne fait pas réapparaître les prédictions devant le public.

| Touche (clavier ou télécommande) | Effet |
| --- | --- |
| → ↓ Espace Entrée Page suivante | Toucher la carte du dessus |
| R ou Début | Remettre le paquet, faces en bas, dans un nouvel étalement |
| Échap ou M | Menu |

### Les cartes

Les prédictions sont écrites **à la main**, à l'encre bleu-noir sur un papier crème. L'app ne télécharge aucune police : elle prend la meilleure police manuscrite déjà installée sur l'appareil (`Bradley Hand` et `Noteworthy` sur iPhone et iPad, `Segoe Script` ou `Ink Free` sur Windows, à défaut l'écriture manuscrite du système). L'aspect varie donc un peu d'un appareil à l'autre — c'est le prix du hors-ligne intégral.

Le **dos des cartes** se choisit dans le menu, en deux réglages qui se combinent — et on les choisit **en les regardant** : chaque bouton montre la petite carte telle qu'elle sera, jamais le nom du style. Les dos sont dessinés dans la couleur en cours, et les couleurs dans le dos en cours.

| Réglage | Valeurs |
| --- | --- |
| Dos des cartes | **Art déco** (soleil levant, chevrons, angles à degrés), **Art nouveau** (corolle, tiges et coups de fouet), **pixel art** (damier et gemme en gros pixels), **minimaliste** (un filet, un cercle, un point), **pop art** (trame de points et étoile d'explosion), **futuriste** (cadran d'instrument et équerres de visée), ou **mélange** |
| Couleur du dos | **Noir**, **rouge**, **bleu**, **blanc** — le tracé reste doré, et passe à l'encre sur le dos blanc — ou **mélange** |

**Mélange** donne un dos, ou une couleur, **différent à chaque carte** : le paquet de six montre les six dessins, toujours dans le même ordre, et les quatre couleurs qui recommencent. Rien n'est laissé au hasard — on sait d'avance ce que le public va voir.

Les six dessins sont des tracés vectoriels ([`src/stage/dos.ts`](src/stage/dos.ts)) : ils restent nets à toutes les tailles d'écran, ne pèsent presque rien dans le cache hors-ligne, et suivent la couleur choisie sans qu'il faille préparer une image par combinaison — six dessins fois quatre couleurs feraient vingt-quatre images.

Les six cartes sont **étalées de haut en bas**, et le paquet remplit la fenêtre : la carte prend d'abord la plus grande taille qui tienne en largeur, sans dépasser 58 % de la hauteur libre, puis **tout ce qui reste en dessous se partage entre les cinq cartes du fond**. Sur un téléphone haut, l'étalement est donc large ; sur un écran court, ou téléphone tourné, il se resserre de lui-même — la pile ne déborde jamais.

L'étalement est **irrégulier, et différent à chaque fois qu'on remet le paquet** : les écarts d'une carte à l'autre sont tirés au sort, comme un paquet étalé à la main, avec un léger décalage latéral et une inclinaison propres à chaque carte. Les écarts sont ensuite ramenés à leur somme exacte, si bien que la pile occupe toujours la même hauteur quelle que soit la façon dont le hasard l'a répartie. La première carte est toujours posée bien droite ; les suivantes gardent le biais que le hasard leur a donné.

**Chaque carte garde sa place.** Quand celle du dessus s'envole, les autres ne remontent pas : le paquet se vide par le haut, comme un vrai étalement sur une table dont on retire les cartes une à une. La place d'une carte ne dépend donc jamais du nombre de cartes déjà sorties, et rien ne bouge derrière celle qui part.

Le tout se détache sur un **tapis vert** de table de jeu : un feutre éclairé au centre, qui s'assombrit vers les bords, avec un grain fin pour la texture du drap. Décor seulement — rien n'y bouge pendant la routine.

### Français ou anglais

Tout est traduit : les prédictions, le menu et l'aide. La langue se choisit **dans le menu** (`FR` / `EN`) et le choix est enregistré comme les autres réglages. À la toute première ouverture, l'app suit la langue du téléphone : anglais s'il est en anglais, français sinon. « Rétablir les réglages par défaut » y revient.

Le **menu** (appui de 3 s, ou Échap / M) permet d'aller directement à une carte, de remettre le paquet, de choisir la langue, puis le dessin et la couleur du dos des cartes en les regardant, et de masquer la jauge de l'appui long — à faire avant de jouer si le public voit l'écran. Le numéro de version de l'app (celui du [journal des versions](CHANGELOG.md)) est affiché sous le titre du menu ; le bas du menu détaille ce qui est vraiment installé sur le téléphone — « 0.1.0 — build 1 (abc1234) », le build étant le nombre de commits — ainsi que l'état du maintien de l'écran allumé et le nom du cache hors-ligne.

Juste après l'ouverture du menu par l'appui long, les touchers dans le menu sont ignorés un court instant : le doigt qui se relève ne clique pas sur le bouton placé dessous.

### Écran toujours allumé

Deux moyens actifs en même temps, relancés à chaque toucher et à chaque retour au premier plan : l'API Screen Wake Lock et une vidéo muette invisible jouée en boucle. La vidéo reste active même quand l'API répond : sur iPhone avant iOS 18.4, dans l'app installée sur l'écran d'accueil, l'API accepte la demande sans garder l'écran allumé. Le menu indique « Screen Wake Lock API + vidéo muette en boucle » quand les deux tournent.

**L'app s'ouvre toujours sur les six cartes**, faces en bas et dans un nouvel étalement : elle est prête à jouer à chaque fois, même après une routine laissée en plan. Rien de l'état du paquet n'est enregistré — on ouvre l'app pour jouer, pas pour reprendre la représentation précédente. Les réglages, eux, sont enregistrés sur l'appareil et **conservés quand l'app se met à jour** : une mise à jour ne remplace que le cache hors-ligne. L'app demande aussi au navigateur un stockage persistant, pour qu'il ne les efface pas de lui-même ; le menu en affiche l'état (« Stockage »).

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
3. **Portrait** : tourner le téléphone dans les deux sens ; l'affichage reste dans l'axe du téléphone, la pile se resserre pour tenir dans l'écran, et les touchers continuent de retourner les cartes.
4. **L'écriture et le retournement** : vérifier que les prédictions s'affichent bien en écriture manuscrite, qu'elles remplissent la carte sans déborder, que les plus longues partent en diagonale, et que la carte tourne d'un seul tenant, sans trait au milieu.
5. **Version** : après une publication, rouvrir l'app avec du réseau, la fermer et la rouvrir : le bas du menu doit afficher le nouveau numéro de build et un nouveau nom de cache, et les réglages (langue, dos des cartes) doivent être restés les mêmes. L'app doit s'ouvrir sur les six cartes.

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

- **Tests unitaires** (`tests/logic/`) : la logique pure de `src/logic/` sous Node — l'état du paquet (retournement, sortie, remise en place, état relu abîmé), l'étalement tiré au sort (ordre, hauteur totale, irrégularité, reproductibilité d'un semis), les gestes avec des rythmes lents et hésitants, les touches, les réglages, les langues — et la validité du contenu de `src/content/cartes.ts` et `src/content/interface.ts` dans les deux langues.
- **Tests dans Chrome** (`tests/e2e/app.e2e.ts`) : l'app compilée dans Chrome sans interface, sur un écran de téléphone simulé, avec de vrais événements tactiles et clavier. La routine entière jusqu'à l'écran vide, le toucher isolé qui ne fait rien et le double toucher qui remet le paquet, deux touchers vifs, le toucher hors de la carte, les six cartes retrouvées à chaque ouverture, les prédictions qui remplissent leur carte, la diagonale des plus longues, les retours à la ligne et les soulignements, le clavier, l'appui de 3 s et le menu (aller à une carte, remettre le paquet, langue, dessin et couleur du dos — « mélange » compris — sans toucher au paquet en cours, boutons qui montrent la carte et non son nom, réglages par défaut), l'étalement de la pile (irrégulier, renouvelé à chaque remise et à chaque ouverture, toujours dans l'écran, et immobile quand une carte s'envole), l'isolement 3D de chaque carte, aucune prédiction qui déborde dans les deux langues et téléphone tourné, et le fonctionnement hors-ligne.
- Les outils communs sont dans `tests/e2e/helpers.ts`. Il faut Google Chrome, trouvé automatiquement (sinon, indiquez son chemin dans `CHROME_PATH`).
- Le calcul du nom de cache au build, la vérification du build, le serveur local et les calculs de rotation sont testés dans le kit.

### Icônes

L'icône est dessinée dans [`src/icon/icon.svg`](src/icon/icon.svg) : trois cartes en éventail sur le tapis vert, celle du dessus retournée. Les dos y sont rouges — les noirs se perdraient dans le fond. Les deux PNG de `public/icons/` en sont rendus avec Chrome sans interface, à refaire après chaque modification du dessin.

Le SVG mesure 512 × 512 : Chrome le **rogne** au lieu de le réduire si on lui demande une fenêtre plus petite. Le 192 se fabrique donc en réduisant le 512, jamais en rendant l'icône dans une petite fenêtre.

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
	--screenshot="public/icons/icon-512.png" --window-size=512,512 "file://$PWD/src/icon/icon.svg"
cp public/icons/icon-512.png public/icons/icon-192.png
sips -z 192 192 public/icons/icon-192.png
```
