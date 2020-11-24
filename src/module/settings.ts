export const registerSettings = function() {
	// Register any custom system settings here
	game.settings.register('ironsworn', 'actorMigrationVersion', {
		scope: 'world',
		config: false,
		type: Number,
		default: 1
	});

	game.settings.register('ironsworn', 'itemMigrationVersion', {
		scope: 'world',
		config: false,
		type: Number,
		default: 1
	});
}
