import { Ironsworn } from "../config";

export interface NPCSheetData extends ActorSheetData {
  ranks: Array<string>;
  currentRank: string;
}

export class IronswornNPCSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['ironsworn', 'sheet', 'actor'],
      width: 625,
      height: 525,
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".tab-body",
        initial: "core"
      }]
    });
  }

  get template() {
    const { type } = this.actor.data;
    return `systems/ironsworn/templates/actor/${type}-sheet.html`;
  }

  getData(): NPCSheetData {
    const data = super.getData() as NPCSheetData;

    data.ranks = Ironsworn.rank;

    const rankIdx = this.actor.data.data.rank;
    let currentRank = 'troublesome';
    Ironsworn.rank.forEach((rank, idx) => {
      if (idx === rankIdx) {
        currentRank = rank;
        return false;
      }
    });
    data.currentRank = currentRank;

    return data;
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);

    const { actor } = this;

    const ranks = html.find('.ranks input');
    ranks.on('change', async evt => {
      evt.preventDefault();

      const el = evt.currentTarget;

      await actor.update({
        'data.rank': parseInt(el.dataset.rankIdx)
      });

      await this._onSubmit(evt);
    });
  }
}
