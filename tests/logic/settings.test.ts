// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, DOS, sanitizeSettings } from '../../src/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { langue: 'en', dos: 'rouge', showHoldRing: false } as const;
	assert.deepEqual(sanitizeSettings(valides), valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	assert.deepEqual(sanitizeSettings({ langue: 'de', dos: 'rouge', showHoldRing: false }), { langue: DEFAULTS.langue, dos: 'rouge', showHoldRing: false });
	assert.deepEqual(sanitizeSettings({ dos: 'vert', showHoldRing: false }, 'en'), { langue: 'en', dos: DEFAULTS.dos, showHoldRing: false });
	assert.deepEqual(sanitizeSettings({ langue: 'fr', dos: 'encre', showHoldRing: 'oui' }), { langue: 'fr', dos: 'encre', showHoldRing: DEFAULTS.showHoldRing });
});

test('des données absentes ou abîmées donnent les réglages par défaut', () => {
	for (const raw of [null, undefined, 'x', 42, []]) assert.deepEqual(sanitizeSettings(raw), DEFAULTS);
});

test('la langue du téléphone sert de défaut tant qu’aucune n’est enregistrée', () => {
	assert.equal(sanitizeSettings(null, 'en').langue, 'en');
	assert.equal(sanitizeSettings({ langue: 'fr' }, 'en').langue, 'fr');
});

test('tous les dos proposés sont acceptés', () => {
	for (const dos of DOS) assert.equal(sanitizeSettings({ dos }).dos, dos);
});
