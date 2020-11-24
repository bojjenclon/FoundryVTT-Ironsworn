/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your system, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your system
 */

// Import TypeScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preloadTemplates.js';
import { registerHandlebars } from './module/handlebars';

import { IronswornActor } from './module/actor/actor';
import { IronswornCharacterSheet } from './module/actor/characterSheet';
import { IronswornItem } from './module/item/item';
import { IronswornItemSheet } from './module/item/itemSheet';
import { IronswornNPCSheet } from './module/actor/npcSheet.js';
import { migrateActors, migrateItems } from './module/migrate.js';

const CURRENT_ACTOR_VERSION = 2;
const CURRENT_ITEM_VERSION = 2;

/* ------------------------------------ */
/* Initialize system					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
	console.log('ironsworn | Initializing ironsworn');

	// Assign custom classes and constants here
	game.ironsworn = {
		IronswornActor,
		IronswornItem
	};

	CONFIG.Actor.entityClass = IronswornActor;
	CONFIG.Item.entityClass = IronswornItem;

	// Register custom system settings
	registerSettings();
	registerHandlebars();

	// Preload Handlebars templates
	await preloadTemplates();

	// Register custom sheets (if any)
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('ironsworn', IronswornCharacterSheet, {
		types: ['character'],
		makeDefault: true,
	});
	Actors.registerSheet('ironsworn', IronswornNPCSheet, {
		types: ['npc'],
		makeDefault: true,
	});

	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('ironsworn', IronswornItemSheet, { makeDefault: true });
});

/* ------------------------------------ */
/* Setup system							*/
/* ------------------------------------ */
Hooks.once('setup', function () {
	// Do anything after initialization but before ready
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', async function () {
	// Migration handling
	if (!game.user.isGM) {
		return;
	}

	const actorMigrationVersion = game.settings.get('ironsworn', 'actorMigrationVersion');
	const itemMigrationVersion = game.settings.get('ironsworn', 'itemMigrationVersion');

	const didMigrate = actorMigrationVersion < CURRENT_ACTOR_VERSION || itemMigrationVersion < CURRENT_ITEM_VERSION;

	if (actorMigrationVersion < CURRENT_ACTOR_VERSION) {
		ui.notifications.info('Performing actor migration. Please do not close Foundry or access/modify actors at this time.');

		await migrateActors(actorMigrationVersion, CURRENT_ACTOR_VERSION);
		await game.settings.set('ironsworn', 'actorMigrationVersion', CURRENT_ACTOR_VERSION);
	}

	if (itemMigrationVersion < CURRENT_ITEM_VERSION) {
		ui.notifications.info('Performing item migration. Please do not close Foundry or access/modify items at this time.');

		await migrateItems(itemMigrationVersion, CURRENT_ITEM_VERSION);
		await game.settings.set('ironsworn', 'itemMigrationVersion', CURRENT_ITEM_VERSION);
	}

	if (didMigrate) {
		ui.notifications.info('Migration complete, you may proceed to use Foundry.');
	}
});

// Add any additional hooks if necessary
