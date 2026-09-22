// Tests de bout en bout : l'app compilée (dist/) dans un vrai Chrome sans interface,
// sur un écran de téléphone, pilotée par de vrais événements tactiles et clavier.
// Lancer : npm run build && npm run test:e2e
//
// Ce qui reste à vérifier sur un vrai téléphone : l'écran toujours allumé, le ressenti des gestes
// et l'installation sur l'écran d'accueil.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { Browser, type Page } from '../../src/kit/node/chrome.ts';
import { startStaticServer, type StaticServer } from '../../src/kit/node/static-server.ts';
import { CARTES } from '../../src/content/cartes.ts';
import { t } from '../../src/logic/i18n.ts';
import { APP_VERSION } from '../../src/version.ts';
import {
	ANIM_MS, appuiLong, CENTER, click, COIN, DEBORDEMENTS, dessus, doubleToucher, ETAT_KEY, expectDessus, isMenuOpen,
	openApp, pressKey, retournee, SETTINGS_KEY, sorties, TEST_TIMEOUT, text, toucher, turnPhone, vide,
} from './helpers.ts';

const COUNT = CARTES.length;

let server: StaticServer;
let browser: Browser;

before(async () => {
	if (!existsSync('dist/index.html')) throw new Error('dist/ absent : lancez « npm run build » avant les tests dans Chrome.');
	server = await startStaticServer('dist', 0);
	browser = await Browser.launch();
});

after(async () => {
	await browser?.close();
	await server?.close();
});

/* ================= Outils ================= */

const withApp = (storage: Record<string, string>, run: (page: Page) => Promise<void>, url = server.url): Promise<void> =>
	openApp(browser, url, COUNT, storage, run);

/** La prédiction lisible sur la carte retournée, dans la langue demandée. */
const prediction = (index: number, lang: 'fr' | 'en'): string => t(CARTES[index]!.texte, lang)!;

/* ================= Démarrage ================= */

test('démarrage : six cartes, la première sur le dessus, dos visible', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		assert.equal(await dessus(page, COUNT), 0);
		assert.equal(await page.evaluate(retournee), false, 'aucune prédiction visible à l’ouverture');
		assert.equal(await page.evaluate(sorties), 0);
		assert.equal(await page.evaluate(isMenuOpen), false);
		assert.equal(await page.evaluate(`document.querySelectorAll('#carte-list button').length`), COUNT);
	});
});

/* ================= La routine ================= */

test('un toucher retourne la carte, le suivant la fait sortir', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page);
		assert.equal(await page.evaluate(retournee), true, 'la carte du dessus est retournée');
		assert.equal(await dessus(page, COUNT), 0, 'c’est toujours la même carte');
		assert.equal(
			await text(page, '#paquet .carte.dessus .prediction'),
			prediction(0, 'fr'),
			'la prédiction de la première carte',
		);

		await toucher(page);
		await expectDessus(page, 1, COUNT);
		assert.equal(await page.evaluate(sorties), 1, 'la première carte est sortie du cadre');
		assert.equal(await page.evaluate(retournee), false, 'la suivante arrive dos visible');
	});
});

test('les six cartes, l’une après l’autre, jusqu’à l’écran vide', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		for (let i = 0; i < COUNT; i++) {
			await expectDessus(page, i, COUNT);
			await toucher(page);
			assert.equal(await text(page, '#paquet .carte.dessus .prediction'), prediction(i, 'fr'), `prédiction ${i + 1}`);
			await toucher(page);
		}
		assert.equal(await page.evaluate(vide), true, 'le paquet est vide');
		assert.equal(await page.evaluate(sorties), COUNT, 'les six cartes sont sorties du cadre');
		assert.equal(await page.evaluate(`document.querySelector('#paquet .carte.dessus')`), null, 'plus de carte sur le dessus');
	});
});

test('écran vide : un toucher seul ne fait rien, un double toucher remet le paquet', TEST_TIMEOUT, async () => {
	// Le paquet est repris vide, sans rejouer toute la routine.
	await withApp({ [ETAT_KEY]: JSON.stringify({ index: COUNT, retournee: false }) }, async (page) => {
		assert.equal(await page.evaluate(vide), true);

		await toucher(page);
		assert.equal(await page.evaluate(vide), true, 'un toucher isolé laisse l’écran vide');

		await doubleToucher(page);
		await expectDessus(page, 0, COUNT);
		assert.equal(await page.evaluate(sorties), 0, 'les six cartes sont revenues');
		assert.equal(await page.evaluate(retournee), false, 'faces en bas');
	});
});

test('deux touchers vifs en pleine routine restent deux touchers', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await page.doubleTap(CENTER);
		await sleep(ANIM_MS);
		// Le premier retourne la carte ; le second, pris pour un double, la touche quand même —
		// mais le délai de garde de stage/paquet.ts l'a ignoré : la carte est encore là, retournée.
		assert.equal(await dessus(page, COUNT), 0);
		assert.equal(await page.evaluate(retournee), true);
	});
});

test('le toucher compte n’importe où sur l’écran, pas seulement sur la carte', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page, COIN);
		assert.equal(await page.evaluate(retournee), true);
	});
});

/* ================= Reprise de la session ================= */

test('rechargement de la page : le paquet est retrouvé ; un état abîmé repart à neuf', TEST_TIMEOUT, async () => {
	await withApp({ [ETAT_KEY]: JSON.stringify({ index: 3, retournee: true }) }, async (page) => {
		await expectDessus(page, 3, COUNT);
		assert.equal(await page.evaluate(retournee), true);
		assert.equal(await page.evaluate(sorties), 3);
	});
	await withApp({ [ETAT_KEY]: '{{pas du JSON' }, async (page) => {
		await expectDessus(page, 0, COUNT);
	});
	await withApp({ [ETAT_KEY]: JSON.stringify({ index: 'trois', retournee: 'oui' }) }, async (page) => {
		await expectDessus(page, 0, COUNT);
		assert.equal(await page.evaluate(retournee), false);
	});
});

/* ================= Clavier et télécommande ================= */

test('clavier : espace avance, R remet le paquet, Échap ouvre et ferme le menu', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await pressKey(page, ' ');
		await page.waitFor(retournee, 'carte retournée à l’espace');
		await sleep(ANIM_MS);
		await pressKey(page, ' ');
		await expectDessus(page, 1, COUNT);

		await pressKey(page, 'r');
		await expectDessus(page, 0, COUNT);
		assert.equal(await page.evaluate(sorties), 0);

		await pressKey(page, 'Escape');
		await page.waitFor(isMenuOpen, 'menu ouvert');
		await pressKey(page, 'Escape');
		await page.waitFor(`!(${isMenuOpen})`, 'menu fermé');
	});
});

/* ================= Menu ================= */

test('appui de 3 s : le menu s’ouvre, sans toucher à la carte', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await appuiLong(page);
		await page.waitFor(isMenuOpen, 'menu ouvert par l’appui long');
		assert.equal(await page.evaluate(retournee), false, 'l’appui long ne retourne pas la carte');
		assert.match(await text(page, '#menu-version'), new RegExp(APP_VERSION.replace(/\./g, '\\.')));
		await click(page, '#close-btn');
		await page.waitFor(`!(${isMenuOpen})`, 'menu fermé');
	});
});

test('menu : aller à une carte, puis remettre le paquet', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await click(page, '#carte-list button[data-index="4"]');
		await expectDessus(page, 4, COUNT);
		assert.equal(await page.evaluate(retournee), false, 'la carte visée arrive dos visible');
		assert.equal(await page.evaluate(sorties), 4);

		await click(page, '#reset-btn');
		await expectDessus(page, 0, COUNT);
		assert.equal(await page.evaluate(sorties), 0);
	});
});

test('menu : la langue change les prédictions et l’interface, et reste enregistrée', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page);
		assert.equal(await text(page, '#paquet .carte.dessus .prediction'), prediction(0, 'fr'));

		await click(page, '#langue-seg button[data-valeur="en"]');
		await page.waitFor(`document.documentElement.lang === 'en'`, 'app en anglais');
		assert.equal(await text(page, '#paquet .carte.dessus .prediction'), prediction(0, 'en'));
		assert.equal(await page.evaluate(retournee), true, 'la carte reste retournée après le changement de langue');
		assert.equal(await text(page, '#close-btn'), 'Close');

		const stored = await page.evaluate<string>(`localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})`);
		assert.match(stored, /"langue":"en"/);
	});
});

test('menu : le dos des cartes se choisit et reste enregistré', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		assert.equal(await page.evaluate(`document.querySelector('#paquet').dataset.dos`), 'bleu');
		await click(page, '#dos-seg button[data-valeur="rouge"]');
		await page.waitFor(`document.querySelector('#paquet').dataset.dos === 'rouge'`, 'dos rouge');
		const stored = await page.evaluate<string>(`localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})`);
		assert.match(stored, /"dos":"rouge"/);

		await click(page, '#defaults-btn');
		await page.waitFor(`document.querySelector('#paquet').dataset.dos === 'bleu'`, 'réglages par défaut rétablis');
	});
});

/* ================= Affichage ================= */

test('aucune prédiction ne déborde de sa carte, dans les deux langues', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		assert.deepEqual(await page.evaluate(DEBORDEMENTS), [], 'prédictions qui débordent (français)');
		await click(page, '#langue-seg button[data-valeur="en"]');
		await page.waitFor(`document.documentElement.lang === 'en'`, 'app en anglais');
		assert.deepEqual(await page.evaluate(DEBORDEMENTS), [], 'prédictions qui débordent (anglais)');
	});
});

test('téléphone tourné : l’app reste en portrait et les cartes tiennent toujours', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		for (const angle of [90, 270, 0] as const) {
			await turnPhone(page, angle);
			await sleep(200);
			assert.deepEqual(await page.evaluate(DEBORDEMENTS), [], `prédictions qui débordent à ${angle}°`);
		}
		await toucher(page);
		assert.equal(await page.evaluate(retournee), true, 'les touchers marchent encore après rotation');
	});
});

/* ================= Hors-ligne ================= */

test('hors-ligne : une fois ouverte, l’app redémarre serveur arrêté', TEST_TIMEOUT, async () => {
	const offlineServer = await startStaticServer('dist', 0);
	let closed = false;
	try {
		await withApp({}, async (page) => {
			await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
			await offlineServer.close();
			closed = true;
			await page.reload();
			await page.waitFor(`document.querySelectorAll('#paquet .carte').length === ${COUNT}`, 'app rechargée hors-ligne', 10_000);
			await toucher(page);
			assert.equal(await page.evaluate(retournee), true, 'la routine se joue sans réseau');
		}, offlineServer.url);
	} finally {
		if (!closed) await offlineServer.close();
	}
});
