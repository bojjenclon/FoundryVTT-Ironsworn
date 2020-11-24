import { Ironsworn } from "../config";

export interface NPCSheetData extends ActorSheetData {
  marks: Array<number>;
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
    const { actor } = this;
    const actorData = actor.data.data;

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

    data.marks = actorData.progress.value;

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

      this.render(true);
    });

    const progressPips = html.find('.progress .pip');
    progressPips.on('mouseover', evt => {
      const target = evt.currentTarget;
      progressPips.each((_idx, el) => {
        $(el).addClass('hover');

        if (el == target) {
          return false;
        }
      });
    });

    progressPips.on('mouseout', evt => {
      const target = evt.currentTarget;
      progressPips.each((_idx, el) => {
        $(el).removeClass('hover');

        if (el == target) {
          return false;
        }
      });
    });

    progressPips.on('click', async (evt) => {
      evt.preventDefault();
      
      const btn = evt.button;
      const target = evt.currentTarget;
      const markIndex = parseInt(target.dataset.idx);

      if (btn === 0) {
        const progressValues = duplicate(actor.data.data.progress.value);

        for (let i = 0; i <= markIndex; i++) {
          progressValues[i] = 4;
        }

        actor.update({
          ['data.progress.value']: progressValues
        });
      }
    });

    progressPips.on('contextmenu', async (evt) => {
      evt.preventDefault();

      const target = evt.currentTarget;
      const markIndex = parseInt(target.dataset.idx);

      const progressValues = duplicate(actor.data.data.progress.value);

      for (let i = markIndex; i < progressValues.length; i++) {
        progressValues[i] = 0;
      }

      actor.update({
        ['data.progress.value']: progressValues
      });
    });

    progressPips.on('mousewheel DOMMouseScroll', async (evt) => {
      evt.preventDefault();

      const origEvt = evt.originalEvent as any;
      const isScrollUp = origEvt.wheelDelta > 0 || origEvt.detail < 0;

      const target = evt.currentTarget;
      const markIndex = parseInt(target.dataset.idx);

      const progressValues = duplicate(actor.data.data.progress.value);
      let markValue = progressValues[markIndex];

      if (isScrollUp) {
        markValue++;
      } else {
        markValue--;
      }

      if (markValue < 0) {
        markValue = 0
      } else if (markValue > 4) {
        markValue = 4;
      }

      // All previous marks should be filled in
      for (let i = 0; i <= markIndex; i++) {
        progressValues[i] = 4;
      }

      progressValues[markIndex] = markValue;

      actor.update({
        ['data.progress.value']: progressValues
      });
    });
  }
}
