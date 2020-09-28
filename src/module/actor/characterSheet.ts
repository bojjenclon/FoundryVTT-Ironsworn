import { Ironsworn } from "../config";
import { IronswornItem } from "../item/item";

export interface CharacterSheetData extends ActorSheetData {
  momentumTrack: Array<Number>;
  healthTrack: Array<Number>;
  spiritTrack: Array<Number>;
  supplyTrack: Array<Number>;

  momentumIdx: Number;
  healthIdx: Number;
  spiritIdx: Number;
  supplyIdx: Number;

  bonds: Array<Object>;
  vows: Array<Object>;

  hoverCard: HTMLElement;
}

export class IronswornCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['ironsworn', 'sheet', 'actor'],
      width: 750,
      height: 800,
    });
  }

  get template() {
    const { type } = this.actor.data;
    return `systems/ironsworn/templates/actor/${type}-sheet.html`;
  }

  bondHoveredIdx: Number = -1;
  vowHoveredIdx: Number = -1;
  hoverCard: HTMLElement;

  getData(): CharacterSheetData {
    const data = super.getData() as CharacterSheetData;
    const { actor } = this;

    data.momentumTrack = Ironsworn.momentum;
    data.healthTrack = Ironsworn.health;
    data.spiritTrack = Ironsworn.spirit;
    data.supplyTrack = Ironsworn.supply;

    const momentumValue = actor.data.data.tracks.momentum.value;
    let momentumIdx = 0;
    Ironsworn.momentum.forEach((val, idx) => {
      if (val === momentumValue) {
        momentumIdx = idx;
        return false;
      }
    });
    data.momentumIdx = momentumIdx;

    const healthValue = actor.data.data.tracks.health.value;
    let healthIdx = 0;
    Ironsworn.health.forEach((val, idx) => {
      if (val === healthValue) {
        healthIdx = idx;
        return false;
      }
    });
    data.healthIdx = healthIdx;

    const spiritValue = actor.data.data.tracks.spirit.value;
    let spiritIdx = 0;
    Ironsworn.health.forEach((val, idx) => {
      if (val === spiritValue) {
        spiritIdx = idx;
        return false;
      }
    });
    data.spiritIdx = spiritIdx;

    const supplyValue = actor.data.data.tracks.supply.value;
    let supplyIdx = 0;
    Ironsworn.health.forEach((val, idx) => {
      if (val === supplyValue) {
        supplyIdx = idx;
        return false;
      }
    });
    data.supplyIdx = supplyIdx;

    // Bonds
    const bonds = [];
    for (let i = 0; i < 10; i++) {
      bonds.push({});
    }

    const actorBonds = actor.itemTypes['bond'] || [];
    actorBonds.forEach(async (bond, idx) => {
      bonds[idx] = bond;
    });

    data.bonds = bonds;

    // Vows
    const vows = [];
    const actorVows = actor.itemTypes['vow'] || [];
    actorVows.forEach(async (bond, idx) => {
      vows[idx] = bond;
    });
    data.vows = vows;

    data.hoverCard = this.hoverCard;

    return data;
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);

    const expLabel = html.find('.experience .label');
    expLabel.on('click', async (evt) => {
      await this.actor.update({
        'data.experience.earned': 0,
        'data.experience.used': 0
      });

      evt.preventDefault();
    });

    expLabel.on('contextmenu', async (evt) => {
      await this.actor.update({
        'data.experience.used': 0
      });

      evt.preventDefault();
    });

    const expPips = html.find('.experience .pip');
    expPips.on('mouseover', evt => {
      const target = evt.currentTarget;
      expPips.each((idx, el) => {
        $(el).find('.image').addClass('hover');

        if (el == target) {
          return false;
        }
      });
    });

    expPips.on('mouseout', evt => {
      const target = evt.currentTarget;
      expPips.each((idx, el) => {
        $(el).find('.image').removeClass('hover');

        if (el == target) {
          return false;
        }
      });
    });

    expPips.on('click', async (evt) => {
      const { actor } = this;

      const btn = evt.button;
      const target = evt.currentTarget;

      if (btn === 0) {
        const pipIdx = parseInt(target.dataset.idx);
        const expUsed = actor.data.data.experience.used;

        await actor.update({
          // If the amount earned decreases and falls below the current
          // amount used, match the used amount to the new earned amount
          'data.experience.used': expUsed > pipIdx ? pipIdx : expUsed,
          'data.experience.earned': pipIdx
        });
      }
    });

    expPips.on('contextmenu', async (evt) => {
      const { actor } = this;

      const target = evt.currentTarget;
      const pipIdx = parseInt(target.dataset.idx);
      const expEarned = actor.data.data.experience.earned;

      // Don't let used exp exceed earned exp
      const adjustedPipIdx = pipIdx > expEarned ? expEarned : pipIdx;

      await this.actor.update({
        'data.experience.used': adjustedPipIdx
      });
    });

    // const progress = html.find('.progress');
    // progress.each((idx, el) => {
    //   var pips = $(el).find('.pip');

    //   pips.on('mouseover', evt => {
    //     const target = evt.currentTarget;
    //     pips.each((idx, el) => {
    //       $(el).addClass('hover');

    //       if (el == target) {
    //         return false;
    //       }
    //     });
    //   });

    //   pips.on('mouseout', evt => {
    //     const target = evt.currentTarget;
    //     pips.each((idx, el) => {
    //       $(el).removeClass('hover');

    //       if (el == target) {
    //         return false;
    //       }
    //     });
    //   });
    // });

    const tracks = html.find('.track');
    tracks.each((idx, el) => {
      const blocks = $(el).find('.block');
      // We actually want to highlight track blocks from the bottom-up,
      // so we work with a reversed list.
      const revBlocks = $(blocks.get().reverse());

      blocks.on('mouseover', evt => {
        const target = evt.currentTarget;
        let isActive = true;
        revBlocks.each((idx, el) => {
          $(el).addClass(isActive ? 'hover-active' : 'hover-inactive');

          if (el == target) {
            isActive = false;
          }
        });
      });

      blocks.on('mouseout', evt => {
        const target = evt.currentTarget;
        let isActive = true;
        revBlocks.each((idx, el) => {
          $(el).removeClass(isActive ? 'hover-active' : 'hover-inactive');

          if (el == target) {
            isActive = false;
          }
        });
      });
    });

    const momentumTrackBlocks = html.find('.momentum-track .block');
    momentumTrackBlocks.on('click', async (evt) => {
      const { actor } = this;

      const btn = evt.button;
      const target = evt.currentTarget;

      if (btn === 0) {
        const blockIdx = parseInt(target.dataset.idx);
        let momentumValue = 0;
        Ironsworn.momentum.forEach((val, idx) => {
          if (idx === blockIdx) {
            momentumValue = val;
            return false;
          }
        });

        await actor.update({
          'data.tracks.momentum.value': momentumValue
        });
      }
    });

    const healthTrackBlocks = html.find('.health-track .block');
    healthTrackBlocks.on('click', async (evt) => {
      const { actor } = this;

      const btn = evt.button;
      const target = evt.currentTarget;

      if (btn === 0) {
        const blockIdx = parseInt(target.dataset.idx);
        let healthValue = 0;
        Ironsworn.health.forEach((val, idx) => {
          if (idx === blockIdx) {
            healthValue = val;
            return false;
          }
        });

        await actor.update({
          'data.tracks.health.value': healthValue
        });
      }
    });

    const spiritTrackBlocks = html.find('.spirit-track .block');
    spiritTrackBlocks.on('click', async (evt) => {
      const { actor } = this;

      const btn = evt.button;
      const target = evt.currentTarget;

      if (btn === 0) {
        const blockIdx = parseInt(target.dataset.idx);
        let spiritValue = 0;
        Ironsworn.spirit.forEach((val, idx) => {
          if (idx === blockIdx) {
            spiritValue = val;
            return false;
          }
        });

        await actor.update({
          'data.tracks.spirit.value': spiritValue
        });
      }
    });

    const supplyTrackBlocks = html.find('.supply-track .block');
    supplyTrackBlocks.on('click', async (evt) => {
      const { actor } = this;

      const btn = evt.button;
      const target = evt.currentTarget;

      if (btn === 0) {
        const blockIdx = parseInt(target.dataset.idx);
        let supplyValue = 0;
        Ironsworn.supply.forEach((val, idx) => {
          if (idx === blockIdx) {
            supplyValue = val;
            return false;
          }
        });

        await actor.update({
          'data.tracks.supply.value': supplyValue
        });
      }
    });

    const bondPips = html.find('.bonds .progress .pip');
    bondPips.on('click', async (evt) => {
      const { actor } = this;

      const btn = evt.button;
      const target = evt.currentTarget;

      if (btn === 0) {
        const { bondId } = target.dataset;
        if (bondId && bondId.length > 0) {
          const bond = actor.getOwnedItem(bondId);
          bond.sheet.render(true);
        } else {
          await actor.createOwnedItem({
            name: 'New Bond',
            type: 'bond',
            data: {}
          }, { renderSheet: true });
        }
      }
    });

    bondPips.on('contextmenu', async (evt) => {
      const { actor } = this;

      const target = evt.currentTarget;
      const bond = target.dataset.bondId;

      if (bond && bond.length > 0) {
        actor.deleteOwnedItem(bond);
      }
    });

    bondPips.on('mouseover', async (evt) => {
      evt.stopPropagation();

      const { actor } = this;

      const target = evt.currentTarget;
      const { bondId } = target.dataset;
      const idx = parseInt(target.dataset.idx);

      // If we have a bond, show its info card
      if (bondId && bondId.length > 0) {
        if (this.bondHoveredIdx === idx) {
          return;
        }

        const bond = actor.getOwnedItem(bondId);

        this.bondHoveredIdx = idx;

        const position = $(target).position();
        const params = {
          x: `${position.left - 80}px`,
          y: `${position.top + 28}px`,
          name: bond.name,
          text: bond.data.data.description.value
        };
        const html = await renderTemplate('systems/ironsworn/templates/dialog/bond-card.html', params);
        this.hoverCard = html;

        await this._onSubmit(evt);
        this.render(true);
      } else {
        // Otherwise, highlight the next bond square to be filled
        const highlightedPip = html.find('.bonds .pip:not(.occupied)').first();
        highlightedPip.addClass('hover');
      }
    });

    bondPips.on('mouseout', async (evt) => {
      evt.stopPropagation();

      // Hide hover card
      if (this.hoverCard) {
        this.bondHoveredIdx = -1;
        delete this.hoverCard;

        await this._onSubmit(evt);
        this.render(true);
      } else {
        // Unhighlight
        const highlightedPip = html.find('.bonds .pip.hover').first();
        highlightedPip.removeClass('hover');
      }
    });

    const vowsHeader = html.find('.vows .lined-header .text');
    vowsHeader.on('click', async (evt) => {
      const { actor } = this;

      await actor.createOwnedItem({
        name: 'New Vow',
        type: 'vow',
        data: {}
      }, { renderSheet: true });
    });

    const vowItems = html.find('.vows .vow-list .vow-item > span');
    vowItems.on('click', async (evt) => {
      const { actor } = this;
      const target = evt.currentTarget;

      const vow = await actor.getOwnedItem(target.dataset.vowId);
      vow.sheet.render(true);
    });

    vowItems.on('mouseover', async (evt) => {
      evt.stopPropagation();

      const { actor } = this;

      const target = evt.currentTarget;
      const { vowId } = target.dataset;
      const idx = parseInt(target.dataset.idx);

      // If we have a bond, show its info card
      if (this.vowHoveredIdx === idx) {
        return;
      }

      const vow = actor.getOwnedItem(vowId);

      this.vowHoveredIdx = idx;

      const position = $(target).position();
      const params = {
        x: `${position.left - 65}px`,
        y: `${position.top + 28}px`,
        name: vow.name,
        rank: Ironsworn.rank[vow.data.data.rank],
        progress: `${vow.data.data.progress.value} / 10`,
        text: vow.data.data.description.value
      };
      const html = await renderTemplate('systems/ironsworn/templates/dialog/vow-card.html', params);
      this.hoverCard = html;

      await this._onSubmit(evt);
      this.render(true);
    });

    vowItems.on('mouseout', async (evt) => {
      evt.stopPropagation();

      // Hide hover card
      if (this.hoverCard) {
        this.vowHoveredIdx = -1;
        delete this.hoverCard;

        await this._onSubmit(evt);
        this.render(true);
      }
    });
  }
}
