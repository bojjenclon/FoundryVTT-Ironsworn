export const preloadTemplates = async function () {
	const templatePaths = [
		"systems/ironsworn/templates/actor/character-sheet.html",

		"systems/ironsworn/templates/item/bond-sheet.html",
		"systems/ironsworn/templates/item/vow-sheet.html",

		"systems/ironsworn/templates/dialog/bond-card.html",
		"systems/ironsworn/templates/dialog/vow-card.html",

		"systems/ironsworn/templates/chat/stat-roll.html"
	];

	return loadTemplates(templatePaths);
}
