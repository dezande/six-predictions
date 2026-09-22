/*
 * LE TEXTE DE L'INTERFACE (menu, aide, états) dans les deux langues.
 * Le texte des prédictions, lui, est dans cartes.ts.
 *
 * Chaque entrée donne le texte en français et en anglais. Les clés se retrouvent dans
 * public/index.html, sur les attributs `data-texte` (contenu de l'élément) et
 * `data-texte-label` (aria-label) : settings/langue.ts les remplit à l'ouverture de l'app
 * et à chaque changement de langue. Les textes calculés (version, état de l'écran…) sont
 * lus depuis settings/panel.ts.
 */

import type { Lang, Texte } from '../logic/i18n.ts';

export const INTERFACE = {
	// Menu
	'menu.titre': { fr: 'Menu', en: 'Menu' },
	'menu.aller': { fr: 'Aller à la carte', en: 'Go to card' },
	'menu.remettre': { fr: 'Remettre le paquet', en: 'Reset the deck' },
	'menu.fermer': { fr: 'Fermer', en: 'Close' },
	'menu.langue': { fr: 'Langue', en: 'Language' },
	'menu.dos': { fr: 'Dos des cartes', en: 'Card back' },
	'menu.aides': {
		fr: 'Aides visuelles : à masquer avant de jouer si le public voit l\'écran.',
		en: 'Visual aids: hide them before performing if the audience can see the screen.',
	},
	'menu.jauge': { fr: 'Jauge de l\'appui long', en: 'Long-press gauge' },
	'menu.version': { fr: 'Version', en: 'Version' },
	'menu.cache': { fr: 'Cache hors-ligne', en: 'Offline cache' },
	'menu.stockage': { fr: 'Stockage', en: 'Storage' },
	'menu.affichage': { fr: 'Affichage', en: 'Display' },
	'menu.defauts': { fr: 'Rétablir les réglages par défaut', en: 'Restore default settings' },

	// Aide (gestes et touches)
	'aide.titre': { fr: 'Gestes et touches', en: 'Gestures and keys' },
	'aide.premier': {
		fr: 'Premier toucher sur la carte du dessus : elle se retourne et montre sa prédiction.',
		en: 'First tap on the top card: it flips over and shows its prediction.',
	},
	'aide.second': {
		fr: 'Second toucher : la carte sort du cadre et découvre la suivante.',
		en: 'Second tap: the card leaves the frame, uncovering the next one.',
	},
	'aide.vide': {
		fr: 'Les six cartes sorties, l\'écran reste vide. Deux touchers rapprochés remettent le paquet, faces en bas.',
		en: 'Once all six cards are gone, the screen stays empty. Two quick taps put the deck back, face down.',
	},
	'aide.appui': { fr: 'Appui de 3 s n\'importe où : ce menu.', en: 'Press and hold anywhere for 3 s: this menu.' },
	'aide.clavier': {
		fr: 'Clavier ou télécommande : → espace Page suivante pour toucher la carte, R pour remettre le paquet, Échap ou M pour le menu.',
		en: 'Keyboard or presenter remote: → space Page Down to tap the card, R to reset the deck, Esc or M for the menu.',
	},

	// Couleurs du dos des cartes (la valeur enregistrée, elle, ne change pas : logic/settings.ts).
	'dos.bleu': { fr: 'Bleu', en: 'Blue' },
	'dos.rouge': { fr: 'Rouge', en: 'Red' },
	'dos.encre': { fr: 'Encre', en: 'Ink' },

	// Cartes et paquet.
	'carte.vide': { fr: 'Le paquet est vide', en: 'The deck is empty' },
	'carte.dos': { fr: 'Carte face cachée', en: 'Face-down card' },

	// États affichés en bas du menu.
	'etat.cacheInactif': { fr: 'inactif', en: 'inactive' },
	'etat.installee': { fr: 'app installée', en: 'installed app' },
	'etat.navigateur': { fr: 'navigateur', en: 'browser' },
	'etat.persistant': { fr: 'persistant', en: 'persistent' },
	'etat.nonGaranti': { fr: 'non garanti', en: 'not guaranteed' },
	'etat.inconnu': { fr: 'inconnu', en: 'unknown' },

	// Maintien de l'écran allumé (kit/web/wake-lock.ts donne l'état, le texte est ici).
	'ecran.actif': { fr: 'Écran : verrou actif', en: 'Screen: lock active' },
	'ecran.inactif': { fr: 'Écran : verrou inactif', en: 'Screen: lock inactive' },
	'ecran.lockVideo': { fr: 'Screen Wake Lock API + vidéo muette en boucle', en: 'Screen Wake Lock API + looping muted video' },
	'ecran.lock': 'Screen Wake Lock API',
	'ecran.video': { fr: 'Vidéo muette en boucle', en: 'Looping muted video' },
	'ecran.rien': { fr: 'Touchez l\'écran pour le réactiver', en: 'Touch the screen to turn it back on' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export function ui(cle: CleInterface, lang: Lang): string {
	const value = INTERFACE[cle];
	return typeof value === 'string' ? value : value[lang];
}
