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
import { Browser, SCREEN, type Page } from '../../src/kit/node/chrome.ts';
import { startStaticServer, type StaticServer } from '../../src/kit/node/static-server.ts';
import { CARTES } from '../../src/content/cartes.ts';
import { t } from '../../src/logic/i18n.ts';
import { APP_VERSION } from '../../src/version.ts';
import {
	ANIM_MS, appuiLong, CENTER, click, COIN, DEBORDEMENTS, dessus, doubleToucher, expectDessus, isMenuOpen,
	openApp, pressKey, retournee, SETTINGS_KEY, sorties, TEST_TIMEOUT, text, toucher, turnPhone, vide, viderLePaquet,
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

/** Le haut de chaque carte à l'écran, de la première au fond du paquet. */
const HAUTS = `[...document.querySelectorAll('#paquet .carte')].map((c) => Math.round(c.getBoundingClientRect().top))`;

/**
 * La prédiction lisible sur la carte retournée, dans la langue demandée. Les retours à la ligne
 * deviennent des `<br>` : ils disparaissent du textContent, on les retire donc de l'attendu.
 */
const prediction = (index: number, lang: 'fr' | 'en'): string => t(CARTES[index]!.texte, lang)!.replaceAll('\n', '');

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
	await withApp({}, async (page) => {
		await viderLePaquet(page, COUNT);
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

/* ================= À chaque ouverture ================= */

test('chaque ouverture redonne les six cartes, même si la routine était en cours', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page);
		await toucher(page);
		await toucher(page);
		await expectDessus(page, 1, COUNT);

		await page.reload();
		await page.waitFor(`document.querySelectorAll('#paquet .carte').length === ${COUNT}`, 'app rouverte');
		assert.equal(await dessus(page, COUNT), 0, 'la première carte est de nouveau sur le dessus');
		assert.equal(await page.evaluate(sorties), 0, 'les six cartes sont là');
		assert.equal(await page.evaluate(retournee), false, 'faces en bas');
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

test('menu ouvert : il recouvre le paquet', TEST_TIMEOUT, async () => {
	// Les cartes s'empilent entre elles avec des z-index élevés : leur empilement doit rester
	// enfermé dans la scène, sinon une carte passe par-dessus le menu (styles/_table.scss).
	await withApp({}, async (page) => {
		await appuiLong(page);
		await page.waitFor(isMenuOpen, 'menu ouvert');
		const dansLeMenu = await page.evaluate<boolean>(
			`Boolean(document.elementFromPoint(${Math.round(CENTER.x)}, ${Math.round(CENTER.y)})?.closest('#menu'))`,
		);
		assert.ok(dansLeMenu, 'au centre de l’écran, c’est le menu qui est devant, pas une carte');
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

// Les six prédictions actuelles sont les mêmes dans les deux langues (des interjections) : c'est
// l'interface qui porte la vérification du changement de langue.
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

/** Les couleurs posées sur les six cartes, et le nombre de traits du dos de chacune. */
const COULEURS_DES_CARTES = `[...document.querySelectorAll('#paquet .carte')].map((c) => c.dataset.couleur)`;
const TRAITS_DES_DOS = `[...document.querySelectorAll('#paquet .carte')].map((c) => c.querySelectorAll('.dos-motif path').length)`;

test('menu : le dos des cartes, dessin et couleur, se choisit et reste enregistré', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		assert.deepEqual(await page.evaluate(COULEURS_DES_CARTES), Array(COUNT).fill('noir'));
		// Chaque carte porte le dessin choisi (stage/dos.ts).
		assert.equal(await page.evaluate(`document.querySelectorAll('#paquet .carte .dos > svg.dos-motif').length`), COUNT);
		const deco = await page.evaluate<number[]>(TRAITS_DES_DOS);

		await click(page, '#couleur-choix button[data-valeur="bleu"]');
		await page.waitFor(`document.querySelector('#paquet .carte').dataset.couleur === 'bleu'`, 'dos bleus');
		assert.deepEqual(await page.evaluate(COULEURS_DES_CARTES), Array(COUNT).fill('bleu'));

		await click(page, '#motif-choix button[data-valeur="pixel"]');
		await page.waitFor(`document.querySelectorAll('#paquet .carte .dos > svg.dos-motif').length === ${COUNT}`, 'dos pixel art posé');
		const pixel = await page.evaluate<number[]>(TRAITS_DES_DOS);
		assert.notDeepEqual(pixel, deco, 'les deux dessins ne sont pas le même');

		const stored = await page.evaluate<string>(`localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})`);
		assert.match(stored, /"motif":"pixel"/);
		assert.match(stored, /"couleur":"bleu"/);

		await click(page, '#defaults-btn');
		await page.waitFor(`document.querySelector('#paquet .carte').dataset.couleur === 'noir'`, 'réglages par défaut rétablis');
	});
});

test('menu : « mélange » donne un dos et une couleur différents à chaque carte', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await click(page, '#motif-choix button[data-valeur="mix"]');
		await click(page, '#couleur-choix button[data-valeur="mix"]');
		await page.waitFor(`document.querySelectorAll('#paquet .carte .dos > svg.dos-motif').length === ${COUNT}`, 'mélange posé');

		// Six cartes, six dessins : chacun des six dos est représenté une fois.
		const traits = await page.evaluate<number[]>(TRAITS_DES_DOS);
		assert.equal(new Set(traits).size, COUNT, `les six dos devraient tous différer (${traits.join(', ')})`);
		// Quatre couleurs pour six cartes : elles se suivent et recommencent.
		const couleurs = await page.evaluate<string[]>(COULEURS_DES_CARTES);
		assert.deepEqual(couleurs, ['noir', 'rouge', 'bleu', 'blanc', 'noir', 'rouge']);
	});
});

test('menu : les boutons du dos montrent la carte, pas son nom', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		// Sept dos (six dessins et le mélange), cinq couleurs (quatre et le mélange).
		assert.equal(await page.evaluate(`document.querySelectorAll('#motif-choix button').length`), 7);
		assert.equal(await page.evaluate(`document.querySelectorAll('#couleur-choix button').length`), 5);
		// Aucun texte dans les boutons : on regarde une vignette, dessinée comme les vraies cartes…
		assert.equal(await page.evaluate(`[...document.querySelectorAll('#motif-choix button, #couleur-choix button')].every((b) => b.textContent.trim() === '')`), true);
		assert.equal(await page.evaluate(`document.querySelectorAll('#motif-choix .vignette svg.dos-motif').length >= 7`), true);
		// … mais le nom reste en étiquette, pour les lecteurs d'écran.
		assert.equal(await page.evaluate(`document.querySelector('#motif-choix button[data-valeur="pop"]').getAttribute('aria-label')`), 'Pop art');
		assert.equal(await page.evaluate(`document.querySelector('#couleur-choix button[data-valeur="blanc"]').getAttribute('aria-label')`), 'Blanc');
		// Les vignettes de couleur suivent le dos choisi, et inversement.
		await click(page, '#motif-choix button[data-valeur="minimal"]');
		const avant = await page.evaluate<number>(`document.querySelectorAll('#couleur-choix button[data-valeur="noir"] .vignette path').length`);
		await click(page, '#motif-choix button[data-valeur="pop"]');
		const apres = await page.evaluate<number>(`document.querySelectorAll('#couleur-choix button[data-valeur="noir"] .vignette path').length`);
		assert.notEqual(apres, avant, 'les vignettes de couleur devraient montrer le dos choisi');
	});
});

test('changer de motif ne touche pas au paquet en cours', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page);
		await toucher(page);
		await toucher(page);
		await expectDessus(page, 1, COUNT);
		assert.equal(await page.evaluate(retournee), true);

		await click(page, '#motif-choix button[data-valeur="nouveau"]');
		await page.waitFor(`document.querySelectorAll('#paquet .carte .dos > svg.dos-motif').length === ${COUNT}`, 'dos refait');
		assert.equal(await dessus(page, COUNT), 1, 'la carte du dessus n’a pas bougé');
		assert.equal(await page.evaluate(retournee), true, 'et elle est toujours retournée');
	});
});

/* ================= Affichage ================= */

test('chaque prédiction remplit sa carte', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		// L'ajustement agrandit le texte autant que la carte le permet : un mot court doit frapper
		// plein cadre, pas flotter au milieu. Le facteur 1 est la taille écrite dans la feuille de
		// style ; toutes ces prédictions tiennent en un ou trois mots, donc toutes la dépassent.
		const fits = await page.evaluate<number[]>(
			`[...document.querySelectorAll('#paquet .carte')].map((c) => Number(c.style.getPropertyValue('--fit')))`,
		);
		assert.equal(fits.length, COUNT);
		for (const [i, fit] of fits.entries()) assert.ok(fit > 1, `la carte ${i + 1} ne remplit pas la carte (--fit ${fit})`);

		// Et le bloc écrit occupe bien la carte : son encombrement à l'écran, inclinaison comprise,
		// couvre l'essentiel de la largeur de la carte.
		const remplissage = await page.evaluate<number[]>(`[...document.querySelectorAll('#paquet .carte')].map((c) => {
			return c.querySelector('.ecriture').getBoundingClientRect().width / c.querySelector('.avant').getBoundingClientRect().width;
		})`);
		for (const [i, part] of remplissage.entries()) assert.ok(part > .75, `la carte ${i + 1} laisse du blanc sur les côtés (${part.toFixed(2)})`);
	});
});

test('les prédictions les plus longues sont écrites en diagonale', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		const angles = await page.evaluate<number[]>(
			`[...document.querySelectorAll('#paquet .carte')].map((c) => parseFloat(c.style.getPropertyValue('--angle')))`,
		);
		// « NEITHER! » et « NOTHING! » ne tiennent pas en largeur : la diagonale les fait grandir.
		assert.ok(angles.some((a) => a !== 0), `aucune prédiction en diagonale (${angles.join(', ')})`);
		// Un mot court reste d'aplomb : l'incliner ne le rendrait pas plus grand, juste moins lisible.
		assert.equal(angles[0], 0, '« NO! » n’a aucune raison de pencher');
		// Et un texte sur plusieurs lignes reste toujours d'aplomb.
		const multiligne = CARTES.findIndex((carte) => (t(carte.texte, 'fr') ?? '').includes('\n'));
		assert.equal(angles[multiligne], 0, 'un pavé de texte en biais ne se lirait plus');
	});
});

test('chaque prédiction est soulignée à la main', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		// Le soulignement fait partie du bloc écrit : il suit le mot, y compris en diagonale.
		assert.equal(await page.evaluate(`document.querySelectorAll('#paquet .carte .ecriture > svg.soulignement').length`), COUNT);
		const traits = await page.evaluate<number[]>(
			`[...document.querySelectorAll('#paquet .carte')].map((c) => c.querySelectorAll('.soulignement path').length)`,
		);
		for (const [i, n] of traits.entries()) assert.ok(n >= 1, `la carte ${i + 1} n’est pas soulignée`);
	});
});

test('un retour à la ligne dans une prédiction coupe la ligne, et rien d’autre ne la coupe', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		const lignes = await page.evaluate<number[]>(
			`[...document.querySelectorAll('#paquet .carte .prediction')].map((p) => p.querySelectorAll('br').length + 1)`,
		);
		const attendues = CARTES.map((carte) => (t(carte.texte, 'fr') ?? '').split('\n').length);
		assert.deepEqual(lignes, attendues);
		// « THIS ONE YES! » tient sur trois lignes, un mot chacune.
		assert.deepEqual(lignes.filter((n) => n > 1), [3]);
		// Aucune coupure automatique : chaque ligne reste d'un seul tenant.
		assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('#paquet .prediction')).whiteSpace`), 'nowrap');
	});
});

test('les cartes sont étalées de haut en bas, et la pile tient dans l’écran', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		const hauts = await page.evaluate<number[]>(HAUTS);
		assert.equal(hauts.length, COUNT);
		for (let i = 1; i < COUNT; i++) {
			assert.ok(hauts[i]! > hauts[i - 1]!, `la carte ${i + 1} doit être plus bas que la précédente (${hauts.join(', ')})`);
			assert.ok(hauts[i]! - hauts[i - 1]! >= 15, `étalement trop discret entre les cartes ${i} et ${i + 1} : ${hauts.join(', ')}`);
		}
		// La pile occupe une bonne part de la hauteur de l'écran…
		const bas = await page.evaluate<number>(`Math.round(document.querySelector('#paquet .carte:last-child').getBoundingClientRect().bottom)`);
		const haut = Math.min(...hauts);
		assert.ok(bas - haut >= SCREEN.height * .6, `pile trop ramassée : ${bas - haut} px pour un écran de ${SCREEN.height}`);
		// … sans jamais en sortir, ni en haut ni en bas.
		assert.ok(haut >= 0, `la première carte déborde en haut (${haut})`);
		assert.ok(bas <= SCREEN.height, `la dernière carte déborde en bas (${bas} > ${SCREEN.height})`);
	});
});

test('l’étalement est irrégulier, et change à chaque fois qu’on remet le paquet', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		const premier = await page.evaluate<number[]>(HAUTS);
		const ecarts = premier.slice(1).map((haut, i) => haut - premier[i]!);
		// Un paquet étalé à la main n'a pas deux écarts identiques.
		assert.ok(Math.max(...ecarts) - Math.min(...ecarts) >= 5, `étalement trop régulier : ${ecarts.join(', ')}`);

		await click(page, '#reset-btn');
		await page.waitFor(`document.querySelector('#paquet .carte.dessus')?.dataset.index === '0'`, 'paquet remis');
		const second = await page.evaluate<number[]>(HAUTS);
		assert.notDeepEqual(second, premier, `le paquet devrait retomber autrement (${premier.join(', ')})`);
		// Mais il tient toujours dans l'écran, et dans le bon ordre.
		for (let i = 1; i < COUNT; i++) assert.ok(second[i]! > second[i - 1]!, `ordre rompu : ${second.join(', ')}`);
		assert.ok(Math.min(...second) >= 0 && Math.max(...second) < SCREEN.height, `pile hors de l’écran : ${second.join(', ')}`);
	});
});

test('quand la carte du dessus part, les autres ne bougent pas d’un pouce', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		const depart = await page.evaluate<number[]>(HAUTS);
		for (let partie = 1; partie <= 3; partie++) {
			await toucher(page);
			await toucher(page);
			await expectDessus(page, partie, COUNT);
			const hauts = await page.evaluate<number[]>(HAUTS);
			assert.deepEqual(
				hauts.slice(partie),
				depart.slice(partie),
				`après ${partie} carte(s) sortie(s), les cartes restantes ont bougé (${hauts.join(', ')})`,
			);
			// Et celle qui vient de partir est bel et bien hors du cadre.
			assert.ok(hauts[partie - 1]! + 1 < 0, `la carte ${partie} est encore visible (${hauts[partie - 1]})`);
		}
	});
});

test('chaque ouverture donne aussi un nouvel étalement', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		const avant = await page.evaluate<number[]>(HAUTS);
		await page.reload();
		await page.waitFor(`document.querySelectorAll('#paquet .carte').length === ${COUNT}`, 'app rouverte');
		assert.notDeepEqual(await page.evaluate<number[]>(HAUTS), avant);
	});
});

test('chaque carte a son propre espace 3D : la carte qui tourne ne coupe pas le plan des autres', TEST_TIMEOUT, async () => {
	// Sans cela, le navigateur découpe les polygones sur la ligne d'intersection et une couture
	// apparaît au milieu de la carte, sur l'axe même du retournement.
	await withApp({}, async (page) => {
		assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('#paquet')).transformStyle`), 'flat');
		assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('#stage')).perspective`), 'none');
		assert.notEqual(await page.evaluate(`getComputedStyle(document.querySelector('#paquet .carte')).perspective`), 'none');
		assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('#paquet .carte-pivot')).transformStyle`), 'preserve-3d');
	});
});

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
