/*
 * Réglages enregistrés sur l'appareil (localStorage) et état du paquet gardé le temps de la
 * session (sessionStorage). Validation : logic/settings.ts et logic/paquet.ts.
 *
 * Les réglages sont conservés d'une version à l'autre : une mise à jour ne remplace que le cache
 * hors-ligne (sw/sw.ts), jamais le localStorage. Renommer une clé ferait perdre les réglages :
 * garder l'ancienne clé en relecture le jour où l'une changerait de nom. Un nouveau réglage prend
 * sa valeur par défaut sans toucher aux autres (sanitizeSettings).
 */

import { readStored, writeStored } from '../kit/web/storage.ts';
import { deviceLang } from '../logic/i18n.ts';
import { sanitizeSettings, type Settings } from '../logic/settings.ts';

const SETTINGS_KEY = 'six-predictions:settings:v1';
const ETAT_KEY = 'six-predictions:etat:v1';

/**
 * Langue de départ, tant qu'aucune n'a été choisie : celle du téléphone (anglais s'il est en
 * anglais, français sinon). Le choix fait dans l'app est ensuite enregistré comme les autres
 * réglages, et « Rétablir les réglages par défaut » revient à la langue du téléphone.
 */
const DEFAULT_LANG = deviceLang(navigator.languages);

/**
 * Réglages en cours. Les autres modules lisent ce binding (toujours à jour) et peuvent modifier
 * ses champs, puis appellent storeSettings() pour valider et enregistrer.
 */
export let settings: Settings = sanitizeSettings(readStored(SETTINGS_KEY), DEFAULT_LANG);

/** Valide et enregistre les réglages. Avec `null` : rétablit les réglages par défaut. */
export function storeSettings(next: unknown = settings): void {
	settings = sanitizeSettings(next, DEFAULT_LANG);
	writeStored(SETTINGS_KEY, settings);
}

/*
 * L'état du paquet ne dure que la session de la page (sessionStorage), pas comme les réglages :
 * chaque ouverture de l'app repart d'un paquet neuf, prêt à jouer, alors qu'un rechargement de la
 * page (mise à jour installée, onglet rouvert par le système) retrouve le paquet là où il en
 * était, pour ne jamais recommencer la routine en plein milieu.
 */

/** État du paquet avant le dernier rechargement de la page (à valider avec sanitizeEtat). */
export function loadEtat(): unknown {
	try {
		const raw = sessionStorage.getItem(ETAT_KEY);
		if (raw !== null) return JSON.parse(raw);
	} catch {
		// Données abîmées ou stockage indisponible.
	}
	return null;
}

/** Retient l'état du paquet pour un éventuel rechargement de la page. */
export function storeEtat(etat: unknown): void {
	try {
		sessionStorage.setItem(ETAT_KEY, JSON.stringify(etat));
	} catch {
		// Mode privé, stockage plein…
	}
}
