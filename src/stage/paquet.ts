/*
 * Le paquet affiché : construction des six cartes, retournement, sortie du cadre et remise en
 * place. Les décisions sont prises par logic/paquet.ts (testé sous Node) ; ce module ne fait que
 * les montrer.
 *
 * Chaque carte est faite de deux faces dans un pivot :
 *   .carte            place la carte dans la pile (décalage selon la profondeur) et la fait sortir
 *     .carte-pivot    la retourne (rotateY), en conservant la perspective
 *       .carte-face.dos     le dos, seul visible tant que la carte n'est pas retournée
 *       .carte-face.avant   la prédiction, écrite à la main
 *
 * Toutes les cartes sont construites une fois pour toutes : la pile est petite, et une carte déjà
 * en place se retourne sans le moindre calcul de mise en page au moment où le doigt la touche.
 */

import { ui } from '../content/interface.ts';
import { CARTES } from '../content/cartes.ts';
import { t } from '../logic/i18n.ts';
import { crans, nouveauSemis, type Cran } from '../logic/etalement.ts';
import { allerA, apresToucher, compteurLabel, DEPART, estVide, remettre, sanitizeEtat, type Etat } from '../logic/paquet.ts';
import type { Motif } from '../logic/settings.ts';
import { langue, onLangChange } from '../settings/langue.ts';
import { loadEtat, loadSemis, settings, storeEtat, storeSemis } from '../settings/store.ts';
import { $ } from '../kit/web/dom.ts';
// Rotation calculée avant le premier ajustement du texte.
import '../kit/web/orientation.ts';
import { buildDos } from './dos.ts';

const paquetEl = $('#paquet');
const annonceEl = $('#annonce');

export const carteCount = CARTES.length;
let etat: Etat = sanitizeEtat(loadEtat(), carteCount);

/*
 * L'étalement du paquet : les écarts, tirés au sort, d'un rang de la pile au suivant. Le semis est
 * gardé le temps de la session, si bien qu'un rechargement de la page retrouve le paquet tel quel ;
 * remettre le paquet en tire un nouveau, et les cartes retombent autrement.
 */
let semis = loadSemis() ?? nouveauSemis();
let etalement: Cran[] = crans(semis, carteCount);

function nouvelEtalement(): void {
	semis = nouveauSemis();
	storeSemis(semis);
	etalement = crans(semis, carteCount);
}

/* ---------- Construction ---------- */

function buildCarte(index: number): HTMLElement {
	const lang = langue();
	const carte = CARTES[index]!;
	const el = document.createElement('article');
	el.className = 'carte';
	el.dataset.index = String(index);
	el.setAttribute('aria-roledescription', 'carte');

	const pivot = el.appendChild(document.createElement('div'));
	pivot.className = 'carte-pivot';

	// Le dos : un dessin SVG (stage/dos.ts), rien à lire.
	const dos = pivot.appendChild(document.createElement('div'));
	dos.className = 'carte-face dos';
	dos.setAttribute('aria-label', ui('carte.dos', lang));
	dos.appendChild(buildDos(settings.motif));

	// L'avant : la prédiction, dans un corps dont le texte s'ajuste à la carte.
	const avant = pivot.appendChild(document.createElement('div'));
	avant.className = 'carte-face avant';
	const corps = avant.appendChild(document.createElement('div'));
	corps.className = 'carte-corps';
	const entete = t(carte.entete, lang);
	if (entete) {
		const p = corps.appendChild(document.createElement('p'));
		p.className = 'entete';
		p.textContent = entete;
	}
	const prediction = corps.appendChild(document.createElement('p'));
	prediction.className = 'prediction';
	prediction.textContent = t(carte.texte, lang) ?? '';
	return el;
}

/** Les cartes construites, de la première (dessus du paquet) à la dernière. */
let carteEls: HTMLElement[] = [];

/** (Re)construit toutes les cartes dans la langue en cours, sans changer l'état du paquet. */
function buildAll(): void {
	carteEls = CARTES.map((_, index) => buildCarte(index));
	// La dernière carte du paquet est au fond : la première du tableau doit être la dernière
	// posée pour passer par-dessus, l'ordre d'empilement étant aussi réglé par z-index.
	paquetEl.replaceChildren(...carteEls);
	fitted.clear();
	render();
}

// Langue changée depuis le menu : tout le texte des cartes est à refaire.
onLangChange(buildAll);

/* ---------- Ajustement du texte ---------- */

/** Plus petite échelle du texte : en dessous, mieux vaut raccourcir la prédiction. */
const MIN_FIT = 0.25;
/**
 * Marge de sécurité de l'ajustement, en pixels : une carte « tout juste » déborderait au moindre
 * écart de police ou d'arrondi (les polices manuscrites diffèrent d'un appareil à l'autre).
 */
const FIT_MARGIN_PX = 4;

/**
 * Plus grande échelle (--fit, entre MIN_FIT et 1) à laquelle la prédiction tient dans la carte,
 * sans débordement en hauteur ni mot coupé en largeur. Recherche par dichotomie.
 */
function fit(el: HTMLElement): void {
	const avant = el.querySelector<HTMLElement>('.avant')!;
	const corps = el.querySelector<HTMLElement>('.carte-corps')!;
	const style = getComputedStyle(avant);
	const height = avant.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
	const fits = (scale: number): boolean => {
		el.style.setProperty('--fit', String(scale));
		return corps.scrollHeight <= height - FIT_MARGIN_PX && corps.scrollWidth <= corps.clientWidth;
	};
	if (fits(1)) return;
	let lo = MIN_FIT;
	let hi = 1;
	for (let step = 0; step < 8; step++) {
		const mid = (lo + hi) / 2;
		if (fits(mid)) lo = mid;
		else hi = mid;
	}
	el.style.setProperty('--fit', String(lo));
}

/** Cartes ajustées à la taille d'écran actuelle. */
const fitted = new Set<HTMLElement>();

function ensureFit(el: HTMLElement): void {
	if (fitted.has(el)) return;
	fit(el);
	fitted.add(el);
}

/** Taille d'écran ou polices changées : tout est à réajuster. */
function refit(): void {
	fitted.clear();
	for (const el of carteEls) ensureFit(el);
}

let resizeFrame = 0;
window.addEventListener('resize', () => {
	cancelAnimationFrame(resizeFrame);
	resizeFrame = requestAnimationFrame(refit);
});
void document.fonts?.ready.then(refit);

/* ---------- Affichage ---------- */

/**
 * Place chaque carte d'après l'état du paquet : sortie du cadre, sur le dessus (retournée ou non)
 * ou dessous, à sa profondeur. Les transitions CSS font le reste (styles/_cartes.scss).
 */
function render(): void {
	const vide = estVide(etat, carteCount);
	for (let i = 0; i < carteCount; i++) {
		const el = carteEls[i]!;
		// Négative : la carte est déjà sortie. 0 : c'est celle du dessus. Positive : elle attend dessous.
		const profondeur = i - etat.index;
		el.classList.toggle('sortie', profondeur < 0);
		el.classList.toggle('dessus', profondeur === 0);
		el.classList.toggle('dessous', profondeur > 0);
		// Une carte sortie garde sa face visible : elle s'envole prédiction en l'air, jamais
		// en se refermant au passage.
		el.classList.toggle('retournee', profondeur < 0 || (profondeur === 0 && etat.retournee));
		el.style.setProperty('--profondeur', String(Math.max(0, profondeur)));
		// Une carte sortie garde la place qu'elle occupait sur le dessus : elle s'envole de là.
		const cran = etalement[Math.max(0, Math.min(profondeur, etalement.length - 1))]!;
		el.style.setProperty('--dy', String(cran.dy));
		el.style.setProperty('--dx', String(cran.dx));
		el.style.setProperty('--rot', String(cran.rot));
		// Seule la carte retournée est à lire : le dos et les cartes sorties ne disent rien.
		el.setAttribute('aria-hidden', String(profondeur !== 0 || !etat.retournee));
		ensureFit(el);
	}
	paquetEl.classList.toggle('vide', vide);
	const lang = langue();
	annonceEl.textContent = vide ? ui('carte.vide', lang)
		: etat.retournee ? (t(CARTES[etat.index]?.texte, lang) ?? '')
		: `${ui('carte.dos', lang)} ${compteurLabel(etat, carteCount)}`;
}

/* ---------- Actions ---------- */

/**
 * Délai pendant lequel un nouveau toucher est ignoré, le temps qu'une carte finisse de se
 * retourner ou de sortir. Sans lui, deux touchers un peu vifs feraient sortir une prédiction
 * avant que le public l'ait vue. Il ne s'applique pas au paquet vide, où le double toucher
 * doit rester possible.
 */
const ACTION_GUARD_MS = 260;
let prochainToucherA = 0;

function setEtat(next: Etat): void {
	if (next.index === etat.index && next.retournee === etat.retournee) return;
	etat = next;
	storeEtat(etat);
	render();
}

/**
 * Fait le changement sans animation : le paquet se retrouve directement dans sa nouvelle position.
 * Remettre le paquet ou sauter à une carte ne sont pas des gestes de la routine — les faire jouer
 * à l'envers (cartes qui reviennent en volant, prédictions qui se referment) n'aurait aucun sens.
 */
function sansAnimation(changer: () => void): void {
	paquetEl.classList.add('no-anim');
	changer();
	// Les transitions reprennent une fois la nouvelle position peinte.
	requestAnimationFrame(() => requestAnimationFrame(() => paquetEl.classList.remove('no-anim')));
}

/** Un toucher sur la scène : la carte du dessus se retourne, puis sort du cadre. */
export function toucher(): void {
	if (estVide(etat, carteCount)) return;
	const now = performance.now();
	if (now < prochainToucherA) return;
	prochainToucherA = now + ACTION_GUARD_MS;
	setEtat(apresToucher(etat, carteCount));
}

/**
 * Le paquet revient au complet, faces en bas (double toucher sur l'écran vide, menu, touche R),
 * et retombe dans un nouvel étalement : deux représentations ne commencent jamais sur le même
 * paquet. Le rendu est refait même si le paquet était déjà neuf, pour que le nouvel étalement se
 * voie tout de suite.
 */
export function remettrePaquet(): void {
	prochainToucherA = 0;
	nouvelEtalement();
	sansAnimation(() => {
		etat = remettre();
		storeEtat(etat);
		render();
	});
}

/** Va à la carte `index`, dos visible : « aller à la carte » du menu. L'étalement ne change pas. */
export function allerACarte(index: number): void {
	prochainToucherA = 0;
	sansAnimation(() => setEtat(allerA(index, carteCount)));
}

export const etatCourant = (): Etat => etat;

/* ---------- Réglages d'affichage ---------- */

/** Motif dessiné sur les dos actuellement en place, pour ne les refaire qu'au vrai changement. */
let motifPose: Motif | null = null;

/** Applique les réglages en cours : dessin et couleur du dos des cartes. */
export function applyDisplaySettings(): void {
	paquetEl.dataset.couleur = settings.couleur;
	if (motifPose !== settings.motif) {
		motifPose = settings.motif;
		for (const el of carteEls) el.querySelector('.dos')!.replaceChildren(buildDos(settings.motif));
	}
	render();
}

// Sans transition au démarrage : le paquet repris apparaît directement à sa place.
paquetEl.classList.add('no-anim');
buildAll();
applyDisplaySettings();
// Un paquet neuf est l'état de départ : rien à reprendre, mais l'écrire tout de suite — l'étalement
// compris — évite qu'un rechargement juste après l'ouverture reparte d'une session vide, et donc
// redistribue les cartes.
if (etat.index === DEPART.index && !etat.retournee) storeEtat(etat);
storeSemis(semis);
requestAnimationFrame(() => requestAnimationFrame(() => paquetEl.classList.remove('no-anim')));
