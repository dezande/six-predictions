# Journal des versions

Toutes les versions des Six prédictions, de la plus récente à la plus ancienne.

Les numéros suivent [semver](https://semver.org/lang/fr/) : `MAJEUR.MINEUR.CORRECTIF`. Chaque version correspond à un tag git et à une [Release GitHub](https://github.com/dezande/six-predictions/releases). Les versions `0.x` sont l'histoire du développement, avant que l'app soit complète et jouable en scène.

**Chaque changement s'écrit ici**, sous « Non publié », dans le même commit que le changement lui-même : la vérification du kit (`npm run check:changelog`) contrôle la forme du journal et refuse un changement qui ne s'explique pas, en pull request comme sur `main`. Publier une version, c'est renommer « Non publié » en numéro de version et poser le tag.

À ne pas confondre avec le **numéro affiché dans le menu de l'app** : celui-là est le nombre de commits, calculé au build, qui identifie précisément la version installée sur un téléphone. Le tableau ci-dessous donne la correspondance.

| Version | Commits | Date | En une phrase |
| --- | --- | --- | --- |
| [0.6.1] | 7 | 2026-09-23 | Les prédictions en français |
| [0.6.0] | 6 | 2026-09-23 | Les vraies prédictions, qui remplissent la carte et partent en diagonale |
| [0.5.0] | 5 | 2026-09-22 | Tapis vert, six dos et quatre couleurs choisis à l'œil, paquet neuf à chaque ouverture |
| [0.4.0] | 4 | 2026-09-22 | Les cartes restantes ne remontent plus quand celle du dessus part |
| [0.3.0] | 3 | 2026-09-22 | Le paquet remplit la fenêtre, étalé à la main et jamais deux fois pareil |
| [0.2.0] | 2 | 2026-09-22 | Paquet étalé, retournement sans couture, dos Art déco et Art nouveau |
| [0.1.0] | 1 | 2026-09-22 | Première version : six cartes à prédictions, PWA hors-ligne |

---

## [0.6.1] — 2026-09-23

7 commits

- **Les six prédictions en français** : `NON!`, `RIEN!`, `NON PLUS!`, `OUPS!`, `OUI C'EST ELLE!` et `AUCUNE`. Elles n'étaient jusqu'ici qu'en anglais, affichées telles quelles dans les deux langues.
- Les deux listes ne se traduisent pas mot à mot : chacune est une suite de réactions naturelle dans sa langue. `NON PLUS!` part en diagonale là où l'anglais met `NOTHING!`, et `AUCUNE` aussi — la mise en page suit le texte, pas la langue.

## [0.6.0] — 2026-09-23

6 commits

Les vraies prédictions remplacent le lorem ipsum, et la carte est faite pour elles.

- **Les six prédictions** : `NO!`, `NEITHER!`, `NOTHING!`, `UYYYY!`, `THIS ONE YES!` et `NONE`. Les mêmes dans les deux langues — ce sont des interjections. La petite ligne d'en-tête disparaît des cartes ; le champ reste disponible pour qui en voudrait une.
- **La prédiction remplit la carte.** Sa taille est calculée pour occuper toute la place : un mot court frappe plein cadre au lieu de flotter au milieu. L'ajustement ne faisait plus que rétrécir ; il agrandit maintenant aussi, jusqu'à douze fois la taille de référence.
- **Correction au passage : l'ajustement du texte ne faisait rien du tout.** L'échelle calculée était posée sur la carte, mais redéclarée à `1` sur le bloc de texte juste en dessous, ce qui l'écrasait. Toutes les prédictions s'affichaient donc à la taille écrite dans la feuille de style. Le débordement ne se voyait pas non plus : la grille de l'avant de la carte s'élargissait au texte au lieu de le contraindre, si bien qu'aucun dépassement n'était jamais détecté.
- **Les prédictions les plus longues sont écrites en diagonale**, d'un coin à l'autre de la carte : la diagonale est bien plus longue que la largeur, et `NEITHER!` comme `NOTHING!` y gagnent un quart de taille. Un mot court reste d'aplomb — l'incliner ne le grandirait pas, seulement le rendrait moins lisible — et un texte sur plusieurs lignes aussi.
- **Les lignes ne sont plus coupées automatiquement** : c'est un retour à la ligne dans `src/content/cartes.ts` qui décide où ça casse, et rien d'autre. `THIS ONE YES!` tient ainsi un mot par ligne, sur toute la hauteur de la carte.
- **Chaque prédiction est soulignée** d'un trait tracé à la main — parfois deux, parfois ondulé, jamais à la règle. Même encre et même grosseur que les lettres, et il suit le mot jusque dans la diagonale.
- Les marges de l'avant de la carte sont resserrées sur les côtés, où chaque pixel gagné fait grandir la prédiction d'autant.

## [0.5.0] — 2026-09-22

5 commits

L'app prend ses couleurs de table de jeu, et le choix des dos se fait à l'œil.

- **Un tapis vert.** Le fond sombre devient un feutre de table de casino : éclairé au centre, assombri vers les bords, avec un grain fin pour la texture du drap. Les cartes claires s'y détachent nettement mieux. La couleur de thème de l'app (barre d'état, écran de démarrage) suit.
- **Quatre nouveaux dos**, en plus de l'Art déco et de l'Art nouveau : **pixel art** (un damier et une gemme en gros pixels), **minimaliste** (un filet, un cercle, un point — rien d'autre), **pop art** (trame de points imprimée et étoile d'explosion) et **futuriste** (cadran d'instrument, équerres de visée, graduations).
- **Quatre couleurs de dos** : le **bleu** et le **blanc** rejoignent le noir et le rouge. Sur le dos blanc, le tracé passe à l'encre — l'or y disparaîtrait.
- **Le choix « mélange »**, pour le dos comme pour la couleur : un dessin, ou une couleur, **différent à chaque carte**. Le paquet de six montre les six dessins dans l'ordre, et les quatre couleurs qui recommencent : rien n'est laissé au hasard, on sait d'avance ce que le public va voir.
- **On choisit en regardant les cartes, plus en lisant des noms.** Les deux réglages deviennent des grilles de vignettes : chaque bouton porte une petite carte face cachée, dessinée exactement comme celles de la scène. Les dos sont montrés dans la couleur en cours, les couleurs dans le dos en cours — le menu montre donc toujours la carte telle qu'elle sera. Les noms restent en étiquette pour les lecteurs d'écran, qui ne voient pas les vignettes.
- **L'app s'ouvre toujours sur les six cartes**, faces en bas et dans un nouvel étalement. L'état du paquet n'est plus gardé d'une ouverture à l'autre : on ouvre l'app pour jouer, pas pour reprendre la représentation précédente. Le code de reprise de session disparaît avec.
- **L'icône est refaite** sur le tapis vert, avec les dos rouges à cadre doré de l'app. Au passage : le PNG de 192 px était **rogné** depuis la première version — Chrome coupe un SVG de 512 px au lieu de le réduire quand on lui demande une petite fenêtre. Il est maintenant fabriqué en réduisant le 512, et le README le dit.

## [0.4.0] — 2026-09-22

4 commits

- **Les cartes restantes ne bougent plus quand celle du dessus s'envole.** L'étalement était calculé sur le rang d'une carte dans la pile : chaque départ faisait remonter tout le paquet d'un cran. Il l'est maintenant sur la carte elle-même, une fois pour toutes — une carte posée là y reste jusqu'à ce qu'elle sorte du cadre, et le paquet se vide par le haut comme un vrai étalement sur une table dont on retire les cartes une à une. La place d'une carte ne dépend plus du nombre de cartes déjà sorties.
- **Le vol part de la place où la carte était posée**, et non plus du centre du cadre : la carte remonte d'une hauteur d'écran plus une hauteur de carte, si bien qu'elle finit hors du cadre d'où qu'elle parte, même du bas de l'étalement. Le vol dure un peu plus longtemps (0,65 s) pour couvrir cette distance sans se presser.
- L'ordre d'empilement suit désormais le rang de la carte dans le paquet, et non sa profondeur du moment : il ne change plus en cours de routine.
- Un test dans Chrome retire trois cartes l'une après l'autre et vérifie, à chaque fois, que les cartes restantes sont exactement où elles étaient — et que celle qui vient de partir est bel et bien hors du cadre.

## [0.3.0] — 2026-09-22

3 commits

Le paquet occupe enfin toute la fenêtre, et ne retombe jamais deux fois de la même façon.

- **L'étalement se calcule sur la place réellement disponible.** La carte prend d'abord la plus grande taille qui tienne en largeur, sans dépasser 58 % de la hauteur libre ; puis **tout ce qui reste en dessous se partage entre les cinq cartes du fond**. Sur un iPhone 15, le paquet passe d'environ 500 px de haut à près de 690 : il remplit la fenêtre au lieu de flotter au milieu. Sur un écran court, ou téléphone tourné, l'étalement se resserre de lui-même — les deux plafonds se répondent pour que la pile n'occupe jamais plus de 93 % de la hauteur libre.
- **L'étalement est irrégulier, et différent à chaque remise du paquet.** Les écarts d'une carte à l'autre sont tirés au sort, comme un paquet étalé à la main, avec un léger décalage latéral et une inclinaison propres à chaque carte. Les écarts sont ensuite ramenés à leur somme exacte : la pile occupe toujours la même hauteur, quelle que soit la façon dont le hasard l'a répartie, et ne déborde donc jamais. La carte du dessus reste toujours posée bien droite — c'est celle qu'on lit.
- Le tirage part d'un **semis gardé le temps de la session** : un rechargement de la page (mise à jour installée, onglet rouvert par le système) retrouve le paquet exactement tel qu'il était, sans réétaler les cartes sous les yeux du public. Seuls « Remettre le paquet », le double toucher sur l'écran vide et la touche R en tirent un nouveau — y compris quand le paquet était déjà neuf, pour que le nouvel étalement se voie tout de suite.
- L'inclinaison d'ensemble de la pile est réduite de moitié : avec un étalement deux fois plus large, l'ancienne pente faisait partir le paquet en biais.
- Nouveau module `src/logic/etalement.ts`, sans DOM et testé sous Node : ordre des cartes, hauteur totale constante, irrégularité, et le fait qu'un même semis redonne toujours le même paquet.

## [0.2.0] — 2026-09-22

2 commits

Le paquet se voit mieux, la carte tourne proprement, et les dos valent le coup d'œil.

- **Le retournement ne se fend plus en deux.** Une couture apparaissait au milieu de la carte, exactement sur l'axe de rotation, dès les premiers degrés : les six cartes partageaient un même espace 3D (`transform-style: preserve-3d` sur le paquet), et la carte qui tourne y coupait le plan des cartes posées à plat — le navigateur découpait alors les polygones sur la ligne d'intersection. Chaque carte porte désormais **sa propre perspective**, et le paquet redevient plat : plus aucune carte ne partage d'espace 3D avec une autre. Un test dans Chrome vérifie cet isolement, pour que le défaut ne revienne pas par une retouche de style.
- **Les six cartes sont étalées de haut en bas** : chacune descend d'un cran sous la précédente et s'incline à peine, au lieu d'un décalage de quelques pixels où seule la carte du dessus se voyait. Tout le paquet se lit d'un coup d'œil. L'étalement se calcule sur la hauteur de l'écran, et la carte prend ensuite la plus grande taille qui tienne dans ce qui reste : la pile ne déborde jamais, même sur un écran court ou téléphone tourné.
- **Deux dos dessinés, au lieu d'un simple quadrillage** : **Art déco** (soleil levant, chevrons, angles à degrés, losange central) et **Art nouveau** (corolle à quatre pétales, tiges et coups de fouet en miroir). Chacun se choisit **en noir ou en rouge**, le tracé restant doré — quatre dos en tout, réglés dans le menu en deux lignes, « Dos des cartes » et « Couleur du dos ». Les dessins sont des tracés vectoriels (`src/stage/dos.ts`) : nets à toutes les tailles, presque rien dans le cache, et la couleur se change sans préparer d'image.
- Changer de dos en pleine routine ne touche pas au paquet : la carte du dessus reste où elle est, retournée si elle l'était.
- **Le menu repasse bien par-dessus le paquet.** La perspective retirée de la scène était aussi ce qui enfermait l'empilement des cartes ; sans elle, une carte serait passée devant le menu. La scène crée maintenant son contexte d'empilement pour elle-même (`isolation: isolate`), et un test dans Chrome vérifie qu'au centre de l'écran, menu ouvert, c'est bien le menu qui est devant.
- L'ancien réglage `dos` (bleu, rouge, encre) disparaît. Un téléphone qui l'avait enregistré revient au dos par défaut (Art déco noir) et **garde ses autres réglages**, langue comprise ; un test unitaire le vérifie.
- L'icône de l'app reprend les nouveaux dos, en rouge — les noirs se perdraient dans son fond sombre.

## [0.1.0] — 2026-09-22

1 commit

Première version de la routine : le paquet, ses gestes et tout ce qu'il faut pour jouer hors-ligne.

- **Six cartes empilées, faces en bas.** Un toucher retourne celle du dessus et montre sa prédiction ; un second la fait sortir du cadre et découvre la suivante. Les six cartes sorties, l'écran reste vide ; **deux touchers rapprochés remettent le paquet**, faces en bas. Un toucher isolé sur l'écran vide ne fait rien : un doigt posé par mégarde à la fin de la routine ne fait pas réapparaître les prédictions devant le public.
- **Les prédictions s'écrivent dans `src/content/cartes.ts`**, en français et en anglais, et nulle part ailleurs. Le texte s'ajuste tout seul à la carte : une prédiction longue reste lisible. Les textes de cette première version sont du lorem ipsum, en attendant les vrais.
- **Une écriture manuscrite** pour les prédictions, sur un papier crème : la meilleure police manuscrite déjà installée sur l'appareil (l'app ne télécharge rien). Le dos des cartes se choisit dans le menu : bleu, rouge ou encre.
- **Menu par un appui de 3 s** (ou Échap / M) : aller à une carte, remettre le paquet, langue, dos des cartes, état de l'écran allumé et version installée.
- **Clavier et télécommande de présentation** : → espace Page suivante pour toucher la carte, R pour remettre le paquet, Échap ou M pour le menu.
- **PWA hors-ligne**, écran toujours allumé, toujours en portrait, réglages conservés d'une version à l'autre et paquet retrouvé après un rechargement de la page. Code commun repris du kit [kit-scene](https://github.com/dezande/kit-scene) `v1.3.0`.
- Logique testée sous Node (l'état du paquet, les gestes, les réglages, le contenu des cartes) et app compilée testée dans Chrome sans interface, sur un écran de téléphone simulé.

---

### Publier une nouvelle version

À chaque changement, décrivez-le sous **« Non publié »**, dans le commit qui le porte. `npm run check:changelog` (la vérification du kit) contrôle la forme du journal et, en pull request comme sur `main`, refuse un changement qui ne s'explique pas. Un commit qui ne touche vraiment à rien (espaces, renommage sans effet) peut porter `[sans journal]` dans son message pour en être dispensé.

Le déploiement, lui, reste automatique : **chaque fusion sur `main` met l'app à jour** (voir le README). Le tag et la Release sont un geste à part, quand le contenu de « Non publié » mérite d'être nommé. La version se prépare dans une pull request comme le reste ; le tag se pose ensuite sur `main`, où la protection ne s'applique pas aux tags.

```sh
git switch -c version-0.2.0
# dans CHANGELOG.md : renommer « ## [Non publié] » en « ## [0.2.0] — 2026-09-30 »,
# ajouter la ligne au tableau du haut (nombre de commits : git rev-list --count HEAD,
# le commit de version compris) et le lien « [0.2.0]: …/releases/tag/v0.2.0 » en bas
# du fichier, mettre src/version.ts au même numéro, puis :
git commit -am "Version 0.2.0"
git push -u origin version-0.2.0 && gh pr create --fill
gh pr merge --auto --rebase   # part dès que la CI est verte

git switch main && git pull
git tag -a v0.2.0 -m "Titre de la version"
git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0 — Titre" --notes-file notes.md
```

- **Correctif** (`1.0.x`) : corrections, tests, rien de visible dans le déroulé.
- **Mineur** (`1.x.0`) : nouvelle prédiction, nouveau réglage, nouveau geste, sans rien casser.
- **Majeur** (`x.0.0`) : le déroulé ou les gestes changent au point de devoir réapprendre la routine.



[0.6.1]: https://github.com/dezande/six-predictions/releases/tag/v0.6.1
[0.6.0]: https://github.com/dezande/six-predictions/releases/tag/v0.6.0
[0.5.0]: https://github.com/dezande/six-predictions/releases/tag/v0.5.0
[0.4.0]: https://github.com/dezande/six-predictions/releases/tag/v0.4.0
[0.3.0]: https://github.com/dezande/six-predictions/releases/tag/v0.3.0
[0.2.0]: https://github.com/dezande/six-predictions/releases/tag/v0.2.0
[0.1.0]: https://github.com/dezande/six-predictions/releases/tag/v0.1.0
