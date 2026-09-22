// Outils communs aux tests dans Chrome : ouverture de l'app, gestes, clavier, attentes.
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { SCREEN, type Browser, type Page, type Point } from '../../src/kit/node/chrome.ts';

/** Clé d'enregistrement des réglages (src/settings/store.ts). Le paquet, lui, n'est pas enregistré. */
export const SETTINGS_KEY = 'six-predictions:settings:v1';

export const TEST_TIMEOUT = { timeout: 60_000 };

/** Le centre de l'écran, là où tombe naturellement le doigt sur la carte du dessus. */
export const CENTER: Point = { x: SCREEN.width / 2, y: SCREEN.height / 2 };
/** Un coin, hors de la carte : un toucher y compte autant qu'un autre. */
export const COIN: Point = { x: 24, y: SCREEN.height - 40 };

/** Langue du « téléphone » de test (voir setPhoneLang) : l'app la suit tant qu'aucune n'a été choisie. */
export const PHONE_LANG = 'fr-FR,fr';

/**
 * Le temps qu'une carte finisse de se retourner ou de sortir : la plus longue transition de
 * styles/_cartes.scss, plus le délai pendant lequel stage/paquet.ts ignore un nouveau toucher.
 */
export const ANIM_MS = 700;

/**
 * Règle la langue du navigateur de la page (navigator.languages), d'où l'app tire sa langue de
 * départ (logic/i18n.ts). Fixée ici plutôt qu'au lancement de Chrome : l'option `--lang` ne fait
 * rien sous Linux (la CI), où Chrome suit la locale du système.
 */
export async function setPhoneLang(page: Page, languages: string): Promise<void> {
	const agent = await page.evaluate<string>('navigator.userAgent');
	await page.send('Emulation.setUserAgentOverride', { userAgent: agent, acceptLanguage: languages });
}

/**
 * Ouvre l'app à `url` dans un nouvel onglet, téléphone en français (PHONE_LANG) et `storage` déjà
 * enregistré (clé → valeur brute, dans localStorage),
 * attend ses `count` cartes, lance `run`, puis vérifie qu'aucune erreur JavaScript n'a eu lieu.
 */
export async function openApp(browser: Browser, url: string, count: number, storage: Record<string, string>, run: (page: Page) => Promise<void>): Promise<void> {
	const page = await browser.newPage();
	try {
		await setPhoneLang(page, PHONE_LANG);
		await page.goto(url);
		const setup = Object.entries(storage).map(([key, value]) => `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`).join('');
		await page.evaluate(`localStorage.clear(); sessionStorage.clear(); ${setup}`);
		await page.reload();
		await page.waitFor(`document.querySelectorAll('#paquet .carte').length === ${count}`, 'cartes construites');
		await run(page);
		assert.deepEqual(page.errors, [], 'erreurs JavaScript dans la page');
	} finally {
		await page.close();
	}
}

/** Index de la carte du dessus, ou `count` quand le paquet est vide. */
export const dessus = (page: Page, count: number): Promise<number> =>
	page.evaluate(`(() => { const c = document.querySelector('#paquet .carte.dessus'); return c ? Number(c.dataset.index) : ${count}; })()`);

/** La carte du dessus est-elle retournée ? */
export const retournee = `Boolean(document.querySelector('#paquet .carte.dessus.retournee'))`;
/** Le paquet est-il vide (toutes les cartes sorties) ? */
export const vide = `document.querySelector('#paquet').classList.contains('vide')`;
/** Nombre de cartes sorties du cadre. */
export const sorties = `document.querySelectorAll('#paquet .carte.sortie').length`;

export const isMenuOpen = `!document.querySelector('#menu').hidden`;

export const click = (page: Page, selector: string): Promise<unknown> => page.evaluate(`document.querySelector('${selector}').click()`);
export const text = (page: Page, selector: string): Promise<string> => page.evaluate(`document.querySelector('${selector}').textContent`);

/** Attend que la carte `index` soit celle du dessus (ou le paquet vide, avec index === count). */
export async function expectDessus(page: Page, index: number, count: number, timeoutMs = 3000): Promise<void> {
	const expression = index >= count
		? `document.querySelectorAll('#paquet .carte.sortie').length === ${count}`
		: `document.querySelector('#paquet .carte.dessus')?.dataset.index === '${index}'`;
	await page.waitFor(expression, `carte ${index + 1} sur le dessus`, timeoutMs, `document.querySelector('#paquet .carte.dessus')?.dataset.index ?? 'paquet vide'`);
}

/** Un toucher du doigt, au centre par défaut, puis le temps que la carte finisse son mouvement. */
export async function toucher(page: Page, point: Point = CENTER): Promise<void> {
	await page.tap(point);
	await sleep(ANIM_MS);
}

/** Joue toute la routine : les `count` cartes retournées puis sorties, jusqu'à l'écran vide. */
export async function viderLePaquet(page: Page, count: number): Promise<void> {
	for (let i = 0; i < count * 2; i++) await toucher(page);
}

/** Deux touchers rapprochés, sous le délai du double toucher (logic/gestures.ts). */
export async function doubleToucher(page: Page, point: Point = CENTER): Promise<void> {
	await page.doubleTap(point);
	await sleep(ANIM_MS);
}

/**
 * Appui long sur l'écran : ouvre le menu au bout de 3 s (GESTURE.holdMs). Rend la main une fois
 * passé le court instant pendant lequel le menu ignore les clics — le doigt qui se relève ne doit
 * pas « cliquer » sur le bouton apparu dessous (settings/panel.ts, CLICK_GUARD_MS).
 */
export async function appuiLong(page: Page, point: Point = CENTER): Promise<void> {
	await page.touchStart(point);
	await sleep(3400);
	await page.touchEnd();
	await sleep(500);
}

/** Touche du clavier (ou d'une télécommande), avec d'éventuels modificateurs (1 Alt, 2 Ctrl, 4 Cmd, 8 Maj). */
export async function pressKey(page: Page, key: string, modifiers = 0): Promise<void> {
	await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key, modifiers });
	await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key, modifiers });
}

/** Téléphone tourné : vers la gauche (angle 90), vers la droite (angle 270), ou droit (0). */
export async function turnPhone(page: Page, angle: 0 | 90 | 270): Promise<void> {
	const landscape = angle !== 0;
	await page.send('Emulation.setDeviceMetricsOverride', {
		width: landscape ? SCREEN.height : SCREEN.width,
		height: landscape ? SCREEN.width : SCREEN.height,
		deviceScaleFactor: 3,
		mobile: true,
		screenOrientation: { type: angle === 0 ? 'portraitPrimary' : angle === 90 ? 'landscapePrimary' : 'landscapeSecondary', angle },
	});
	await page.waitFor(`document.querySelector('#app').dataset.rotation === '${angle === 0 ? 0 : angle === 90 ? -90 : 90}'`, `rotation pour l'angle ${angle}`, 3000);
}

/** Cartes dont la prédiction sort de sa carte, avec l'échelle de texte calculée. */
export const DEBORDEMENTS = `[...document.querySelectorAll('#paquet .carte')].filter((carte) => {
	const avant = carte.querySelector('.avant');
	const corps = carte.querySelector('.carte-corps');
	const style = getComputedStyle(avant);
	const height = avant.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
	return corps.scrollHeight > height + 1 || corps.scrollWidth > corps.clientWidth + 1;
}).map((carte) => ({
	carte: Number(carte.dataset.index) + 1,
	fit: carte.style.getPropertyValue('--fit'),
	contenu: carte.querySelector('.carte-corps').scrollHeight,
	place: Math.round(carte.querySelector('.avant').clientHeight),
}))`;
