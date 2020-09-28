export const preloadTemplates = async function() {
	const templatePaths = [
		"systems/ironsworn/templates/actor/character-sheet.html"
	];

	return loadTemplates(templatePaths);
}
