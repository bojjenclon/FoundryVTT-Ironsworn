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
	// Do anything after initialization but before
	// ready
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
	// Do anything once the system is ready
});

// Add any additional hooks if necessary
