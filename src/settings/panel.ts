/*
 * Menu, ouvert par un appui de 3 s (ou Échap / M au clavier) :
 * aller à une carte, remettre le paquet, langue, dos des cartes, état de l'écran et version.
 */

import { CARTES } from '../content/cartes.ts';
import { ui, type CleInterface } from '../content/interface.ts';
import { BUILD } from '../kit/web/build.ts';
import { $ } from '../kit/web/dom.ts';
import { requestPersistentStorage, type StorageState } from '../kit/web/storage.ts';
import { appCacheNames } from '../kit/web/updates.ts';
import { onWakeChange, type WakeState } from '../kit/web/wake-lock.ts';
import { carteLabel } from '../logic/cartes.ts';
import { LANGS } from '../logic/i18n.ts';
import { compteurLabel, estVide } from '../logic/paquet.ts';
import { COULEURS, MOTIFS, type Settings } from '../logic/settings.ts';
import { allerACarte, applyDisplaySettings, carteCount, etatCourant, remettrePaquet } from '../stage/paquet.ts';
import { APP_VERSION } from '../version.ts';
import { langue, onLangChange, setLangue } from './langue.ts';
import { settings, storeSettings } from './store.ts';

const menu = $('#menu');
const list = $('#carte-list');

export const isMenuOpen = (): boolean => !menu.hidden;

/* ---------- Liste des cartes ---------- */

/** Liste « Aller à la carte », avec le début de chaque prédiction dans la langue en cours. */
function buildList(): void {
	const lang = langue();
	list.replaceChildren();
	for (let i = 0; i < carteCount; i++) {
		const button = list.appendChild(document.createElement('button'));
		button.type = 'button';
		button.dataset.index = String(i);
		const number = button.appendChild(document.createElement('span'));
		number.className = 'num';
		number.textContent = String(i + 1);
		button.append(carteLabel(CARTES[i], lang));
		button.addEventListener('click', () => {
			allerACarte(i);
			closeMenu();
		});
	}
}
buildList();

/* ---------- Choix en segments (langue, dos) ---------- */

/**
 * Boutons d'un réglage à plusieurs valeurs. `libelle` donne le texte d'une valeur dans la langue
 * en cours ; la valeur enregistrée, elle, ne change jamais avec la langue (logic/settings.ts).
 */
function buildSegment(selector: string, valeurs: readonly string[], libelle: (valeur: string) => string, onPick: (valeur: string) => void): void {
	const seg = $(selector);
	seg.replaceChildren();
	for (const valeur of valeurs) {
		const button = seg.appendChild(document.createElement('button'));
		button.type = 'button';
		button.setAttribute('role', 'radio');
		button.dataset.valeur = valeur;
		button.textContent = libelle(valeur);
		button.addEventListener('click', () => onPick(valeur));
	}
}

function buildSegments(): void {
	// Les langues se nomment elles-mêmes : « FR » et « EN », quelle que soit la langue affichée.
	buildSegment('#langue-seg', LANGS, (valeur) => valeur.toUpperCase(), (valeur) => setLangue(valeur as (typeof LANGS)[number]));
	buildSegment('#motif-seg', MOTIFS, (valeur) => ui(`motif.${valeur}` as CleInterface, langue()), (valeur) => update({ motif: valeur as Settings['motif'] }));
	buildSegment('#couleur-seg', COULEURS, (valeur) => ui(`couleur.${valeur}` as CleInterface, langue()), (valeur) => update({ couleur: valeur as Settings['couleur'] }));
}
buildSegments();

/* ---------- Affichage du menu ---------- */

/** Recopie les réglages et l'état en cours dans le menu. */
function refresh(): void {
	$<HTMLInputElement>('#show-hold-ring').checked = settings.showHoldRing;
	for (const button of $('#langue-seg').querySelectorAll<HTMLButtonElement>('button')) {
		button.setAttribute('aria-checked', String(button.dataset.valeur === settings.langue));
	}
	for (const button of $('#motif-seg').querySelectorAll<HTMLButtonElement>('button')) {
		button.setAttribute('aria-checked', String(button.dataset.valeur === settings.motif));
	}
	for (const button of $('#couleur-seg').querySelectorAll<HTMLButtonElement>('button')) {
		button.setAttribute('aria-checked', String(button.dataset.valeur === settings.couleur));
	}
	const etat = etatCourant();
	for (const button of list.querySelectorAll<HTMLButtonElement>('button')) {
		const isCurrent = Number(button.dataset.index) === etat.index;
		button.classList.toggle('current', isCurrent);
		if (isCurrent) button.setAttribute('aria-current', 'true');
		else button.removeAttribute('aria-current');
	}
	const lang = langue();
	$('#menu-position').textContent = estVide(etat, carteCount) ? ui('carte.vide', lang) : compteurLabel(etat, carteCount);
	$('#menu-version').textContent = `${ui('menu.version', lang)} ${APP_VERSION}`;
	// En bas du menu, le détail exact de ce qui est installé : numéro de build et commit.
	$('#about-version').textContent = `${APP_VERSION} — build ${BUILD.version} (${BUILD.commit})`;
	void showCache();
	void requestPersistentStorage().then((state) => {
		$('#about-storage').textContent = ui(STORAGE_TEXTS[state], langue());
	});
	const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as { standalone?: boolean }).standalone === true;
	$('#about-display').textContent = ui(standalone ? 'etat.installee' : 'etat.navigateur', lang);
}

/** État du stockage persistant (kit/web/storage.ts) → texte du menu. */
const STORAGE_TEXTS: Record<StorageState, CleInterface> = {
	'persistant': 'etat.persistant',
	'non garanti': 'etat.nonGaranti',
	'inconnu': 'etat.inconnu',
};

/**
 * Nom du cache hors-ligne (six-predictions-<empreinte>). L'empreinte change à chaque nouvelle
 * version : c'est ce qui fait retélécharger l'app aux téléphones où elle est installée.
 */
async function showCache(): Promise<void> {
	const names = await appCacheNames('six-predictions');
	$('#about-cache').textContent = names.length === 0 ? ui('etat.cacheInactif', langue()) : names.join(', ');
}

/*
 * État du maintien de l'écran allumé (kit/web/wake-lock.ts donne l'état, le texte est traduit ici
 * plutôt que repris du kit, qui ne parle que français).
 */
let lastWake: WakeState = { lock: false, video: false };

function showWake(state: WakeState): void {
	const lang = langue();
	lastWake = state;
	const active = state.lock || state.video;
	$('#wake-dot').className = `dot ${state.lock ? 'lock' : state.video ? 'video' : 'off'}`;
	$('#wake-text').textContent = ui(active ? 'ecran.actif' : 'ecran.inactif', lang);
	const detail: CleInterface = state.lock && state.video ? 'ecran.lockVideo' : state.lock ? 'ecran.lock' : state.video ? 'ecran.video' : 'ecran.rien';
	$('#wake-detail').textContent = ui(detail, lang);
}

onWakeChange(showWake);

/**
 * Clics ignorés dans le menu jusqu'à cet instant (performance.now()). Le doigt de l'appui long
 * se relève sur le menu qui vient d'apparaître : sans ça, il « cliquerait » sur le bouton
 * placé dessous (aller à une carte, cocher une option) et refermerait le menu.
 */
let ignoreClicksUntil = 0;
/** Délai après le relâchement de l'appui long, pour le clic que le navigateur envoie ensuite. */
const CLICK_GUARD_MS = 400;

menu.addEventListener('click', (event) => {
	if (performance.now() >= ignoreClicksUntil) return;
	event.preventDefault();
	event.stopPropagation();
}, true);

/** Ouvre le menu. `byHold` : ouvert par l'appui long, doigt encore posé (voir holdReleased). */
export function openMenu(byHold = false): void {
	if (byHold) ignoreClicksUntil = Infinity;
	refresh();
	menu.hidden = false;
	list.querySelector('.current')?.scrollIntoView({ block: 'center' });
}

/** Le doigt de l'appui long s'est relevé : les clics seront de nouveau acceptés dans un instant. */
export function holdReleased(): void {
	if (ignoreClicksUntil === Infinity) ignoreClicksUntil = performance.now() + CLICK_GUARD_MS;
}

export function closeMenu(): void {
	menu.hidden = true;
}

/* ---------- Réglages ---------- */

/** Enregistre les réglages (null : réglages par défaut), les applique et met le menu à jour. */
function save(next: Settings | null): void {
	storeSettings(next);
	applyDisplaySettings();
	refresh();
}

const update = (change: Partial<Settings>): void => save({ ...settings, ...change });

$<HTMLInputElement>('#show-hold-ring').addEventListener('change', (event) => {
	update({ showHoldRing: (event.target as HTMLInputElement).checked });
});

// Langue changée depuis le menu : le menu porte du texte construit ici.
onLangChange(() => {
	buildList();
	buildSegments();
	showWake(lastWake);
	if (isMenuOpen()) refresh();
});

$('#reset-btn').addEventListener('click', () => {
	remettrePaquet();
	closeMenu();
});
$('#close-btn').addEventListener('click', closeMenu);
$('#defaults-btn').addEventListener('click', () => save(null));
