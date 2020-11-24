export async function migrateActors(from: number, to: number) {
  if (from < 2) {
    // TODO: Batch updates
    for (let actor of game.actors.entities) {
      const data = duplicate(actor.data);

      if (data.type === 'npc') {
        // Add progress array
        const progressArray = [];
        for (let i = 0; i < 10; i++) {
          progressArray.push(0);
        }
        data.data.progress = {
          value: progressArray
        };
      }

      data.data.version = 2;

      await actor.update(data, {});
    }

    from++;
  }
}

export async function migrateItems(from: number, to: number) {
  let itemList = [];

  itemList = itemList.concat(game.items.entries);
  // Also update owned items
  for (let actor of game.actors.entities) {
    itemList = itemList.concat(actor.items.entries);
  }

  if (from < 2) {
    // TODO: Batch updates
    for (let item of itemList) {
      const data = duplicate(item.data);

      if (data.type === 'vow') {
        const progress = data.data.progress.value;
        const progressArray = [];

        // Convert static progress number to array of values
        for (let i = 0; i < 10; i++) {
          progressArray.push(i < progress ? 4 : 0);
        }

        data.data.progress.value = progressArray;
      }

      data.data.version = 2;

      await item.update(data, {});
    }

    from++;
  }
}
