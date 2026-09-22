/*
 * LES SIX PRÉDICTIONS : tout le contenu de la routine est ici, et nulle part ailleurs.
 * Écrire une prédiction ne demande de toucher à aucun autre fichier.
 *
 * Les cartes sont jouées dans l'ordre : la première du tableau est celle du dessus du paquet.
 * Chaque carte porte
 *   texte   la prédiction, écrite à la main au dos de la carte (obligatoire) ;
 *   entete  une petite ligne au-dessus, plus discrète : une date, un nom, un numéro (facultatif).
 *
 * Chaque texte s'écrit dans les deux langues, `{ fr: '…', en: '…' }` — ou une seule fois, en
 * chaîne, quand il est identique (un nombre, un nom propre). La taille du texte s'ajuste toute
 * seule à la carte : une prédiction longue reste lisible, mais une courte frappe plus fort.
 *
 * TEXTES PROVISOIRES : du lorem ipsum, en attendant les vraies prédictions.
 * Les tests (tests/logic/cartes.test.ts) vérifient la forme de ce fichier, jamais le sens.
 */

import type { Carte } from '../logic/cartes.ts';

export const CARTES: readonly Carte[] = [
	{
		entete: { fr: 'Première prédiction', en: 'First prediction' },
		texte: { fr: 'Lorem ipsum dolor sit amet', en: 'Sed ut perspiciatis unde omnis' },
	},
	{
		entete: { fr: 'Deuxième prédiction', en: 'Second prediction' },
		texte: { fr: 'Consectetur adipiscing elit', en: 'Iste natus error sit voluptatem' },
	},
	{
		entete: { fr: 'Troisième prédiction', en: 'Third prediction' },
		texte: { fr: 'Sed do eiusmod tempor incididunt ut labore', en: 'Accusantium doloremque laudantium, totam rem aperiam' },
	},
	{
		entete: { fr: 'Quatrième prédiction', en: 'Fourth prediction' },
		texte: { fr: 'Ut enim ad minim veniam', en: 'Eaque ipsa quae ab illo inventore' },
	},
	{
		entete: { fr: 'Cinquième prédiction', en: 'Fifth prediction' },
		texte: { fr: 'Quis nostrud exercitation ullamco laboris', en: 'Veritatis et quasi architecto beatae vitae' },
	},
	{
		entete: { fr: 'Sixième prédiction', en: 'Sixth prediction' },
		texte: { fr: 'Duis aute irure dolor', en: 'Dicta sunt explicabo' },
	},
];
