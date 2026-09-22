/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/logic/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé.
 */

import { isLang, type Lang } from './i18n.ts';

export const DOS = ['bleu', 'rouge', 'encre'] as const;
/** Couleur du dos des cartes, choisie dans le menu. */
export type Dos = (typeof DOS)[number];

export interface Settings {
	/** Langue des prédictions et de l'interface. */
	langue: Lang;
	/** Couleur du dos des cartes. */
	dos: Dos;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

/**
 * Valeurs par défaut. La langue par défaut dépend du téléphone (i18n.ts : deviceLang) :
 * elle est passée à sanitizeSettings, celle inscrite ici n'est qu'un dernier recours.
 */
export const DEFAULTS: Readonly<Settings> = Object.freeze({
	langue: 'fr',
	dos: 'bleu',
	showHoldRing: true,
});

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const isDos = (v: unknown): v is Dos => DOS.includes(v as Dos);

/**
 * Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur
 * par défaut. `defaultLang` est la langue à prendre quand aucune n'est enregistrée (celle du
 * téléphone, calculée par l'app) ; avec `null`, tout revient aux valeurs par défaut.
 */
export function sanitizeSettings(raw: unknown, defaultLang: Lang = DEFAULTS.langue): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		langue: isLang(src.langue) ? src.langue : defaultLang,
		dos: isDos(src.dos) ? src.dos : DEFAULTS.dos,
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}
