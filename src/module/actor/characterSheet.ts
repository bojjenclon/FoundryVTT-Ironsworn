import { Ironsworn } from "../config";

const CHAT_ROLL_HTML = 'systems/ironsworn/templates/chat/stat-roll.html';

export interface CharacterSheetData extends ActorSheetData {
  momentumTrack: Array<Number>;
  healthTrack: Array<Number>;
  spiritTrack: Array<Number>;
  supplyTrack: Array<Number>;

  momentumIdx: Number;
  healthIdx: Number;
  spiritIdx: Number;
  supplyIdx: Number;

  experience: Array<Object>;

  bonds: Array<Object>;
  vows: Array<Object>;
  assets: Array<Object>;

  equipment: Array<Object>;

  hoverCard: HTMLElement;
}

export class IronswornCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['ironsworn', 'sheet', 'actor'],
      width: 750,
      height: 800,
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

  bondHoveredIdx: number = -1;
  vowHoveredIdx: number = -1;
  assetHoveredIdx: number = -1;
  assetAbilityIdx: number = 0;
  gearHoveredIdx: number = -1;

  hoverTimeout: number;
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

    const experience = [];
    const expEarned = actor.data.data.experience.earned;
    const expUsed = actor.data.data.experience.used;
    for (let i = 0; i < 30; i++) {
      experience.push({
        earned: i < expEarned,
        used: i < expUsed
      });
    }
    data.experience = experience;

    // Bonds
    const bonds = [];
    // Since bonds are displayed as a block of pips, we need
    // to ensure the array is always a fixed size of 10.
    for (let i = 0; i < 10; i++) {
      bonds.push({});
    }

    const actorBonds = actor.itemTypes['bond'] || [];
    actorBonds.forEach(async (bond, idx) => {
      bonds[idx] = bond;
    });

    data.bonds = bonds;

    // Vows
    data.vows = actor.itemTypes['vow'] || [];

    // Assets
    data.assets = actor.itemTypes['asset'] || [];

    data.equipment = actor.itemTypes['equipment'] || [];

    data.hoverCard = this.hoverCard;

    return data;
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);

    html.find('.stat .label').on('click', async (evt) => {
      const target = evt.currentTarget;
      const stat = target.dataset.stat;

      const { actor } = this;
      const rollResult = actor.rollStat(stat);
      const rollString = rollResult.roll;
      const rollSuccesses = rollResult.successes;

      let resultString = '';
      if (rollSuccesses === 0) {
        resultString = game.i18n.localize('ironsworn.roll.miss');
      } else if (rollSuccesses == 1) {
        resultString = game.i18n.localize('ironsworn.roll.hit.weak');
      } else {
        resultString = game.i18n.localize('ironsworn.roll.hit.strong');
      }

      const chatContent = await renderTemplate(CHAT_ROLL_HTML, {
        roll: rollString,
        result: resultString
      });

      const statTranslation = game.i18n.localize(`ironsworn.stat.${stat}`);
      ChatMessage.create([{
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.localize('ironsworn.roll.stat').replace('##STAT##', statTranslation),
        content: chatContent,
      }]);
    });

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
      const ctrlDown = evt.ctrlKey;

      const { actor } = this;
      const expEarned = actor.data.data.experience.earned;

      const target = evt.currentTarget;
      let isActive = true;
      expPips.each((idx, el) => {
        if (!ctrlDown) {
          $(el).find('.image').addClass(isActive ? 'earned-hover-active' : 'earned-hover-inactive');
        } else if (idx < expEarned) {
          // If we're trying to show used XP, we want to preserve the appearance of earned
          // XP beneath the available used XP, so we use a bit of a "hack" to keep
          // the look and feel consistent during the mouse over.
          $(el).find('.image').addClass(isActive ? 'used-hover-active' : 'earned-hover-active');
        }

        if (el == target) {
          isActive = false;
        }
      });

      evt.stopPropagation();
    });

    expPips.on('mouseout', evt => {
      expPips.each((idx, el) => {
        const img = $(el).find('.image');

        img.removeClass('used-hover-active used-hover-inactive earned-hover-active earned-hover-inactive');
      });

      evt.stopPropagation();
    });

    expPips.on('click', async (evt) => {
      const ctrlDown = evt.ctrlKey;

      const { actor } = this;

      const btn = evt.button;
      const target = evt.currentTarget;

      if (btn === 0) {
        const pipIdx = parseInt(target.dataset.idx);

        // Set used XP if control is down
        if (ctrlDown) {
          const expEarned = actor.data.data.experience.earned;

          // Don't let used exp exceed earned exp
          const adjustedPipIdx = pipIdx > expEarned ? expEarned : pipIdx;

          await this.actor.update({
            'data.experience.used': adjustedPipIdx
          });
        } else {
          // Otherwise, set earned XP
          const expUsed = actor.data.data.experience.used;

          await actor.update({
            // If the amount earned decreases and falls below the current
            // amount used, match the used amount to the new earned amount
            'data.experience.used': expUsed > pipIdx ? pipIdx : expUsed,
            'data.experience.earned': pipIdx
          });
        }

      }
    });

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
      const { bondId } = target.dataset;

      if (btn === 0) {
        // If LMC is clicked, we either add a new bond,
        // or open the existing one.
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
      const { bondId } = target.dataset;

      // If we have a valid bond remove it from the actor.
      // TODO: Confirmation dialog?
      if (bondId && bondId.length > 0) {
        actor.deleteOwnedItem(bondId);
      }
    });

    bondPips.on('mouseover', async (evt) => {
      evt.stopPropagation();

      clearTimeout(this.hoverTimeout);

      const target = evt.currentTarget;
      const { bondId } = target.dataset;
      const idx = parseInt(target.dataset.idx);

      // If we have a bond, show its info card
      if (bondId && bondId.length > 0) {
        this.hoverTimeout = setTimeout(async () => {
          const { actor } = this;

          if (this.bondHoveredIdx === idx) {
            return;
          }

          const bond = actor.getOwnedItem(bondId);

          if (!bond) {
            return;
          }

          this.bondHoveredIdx = idx;

          const position = $(target).position();
          const params = {
            x: `${position.left - 100 + evt.offsetX}px`,
            y: `${position.top}px`,
            name: bond.name,
            text: bond.data.data.description.value
          };
          const html = await renderTemplate('systems/ironsworn/templates/dialog/bond-card.html', params);
          this.hoverCard = html;

          this.render(true);
        }, 500);
      } else {
        // Otherwise, highlight the next bond square to be filled
        const highlightedPip = html.find('.bonds .pip:not(.occupied)').first();
        highlightedPip.addClass('hover');
      }
    });

    bondPips.on('mouseout', async (evt) => {
      evt.stopPropagation();

      clearTimeout(this.hoverTimeout);

      this.bondHoveredIdx = -1;

      // Hide hover card
      if (this.hoverCard) {
        delete this.hoverCard;

        this.render(true);
      } else {
        // Unhighlight
        const highlightedPip = html.find('.bonds .pip.hover').first();
        highlightedPip.removeClass('hover');
      }
    });

    // Vows
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

    vowItems.on('contextmenu', async (evt) => {
      const { actor } = this;
      const target = evt.currentTarget;

      this.vowHoveredIdx = -1;
      delete this.hoverCard;

      await actor.deleteOwnedItem(target.dataset.vowId);
    });

    vowItems.on('mouseover', async (evt) => {
      clearTimeout(this.hoverTimeout);

      this.hoverTimeout = setTimeout(async () => {
        evt.stopPropagation();

        const { actor } = this;

        const target = evt.currentTarget;
        const { vowId } = target.dataset;
        const idx = parseInt(target.dataset.idx);

        // If we're already showing this vow, nothing more to do
        if (this.vowHoveredIdx === idx) {
          return;
        }

        const vow = actor.getOwnedItem(vowId);

        // No vow was found, break out early
        if (!vow) {
          return;
        }

        // If we have a vow, show its info card
        this.vowHoveredIdx = idx;

        const position = $(target).position();
        const params = {
          x: `${position.left - 125 + evt.offsetX}px`,
          y: `${position.top}px`,
          name: vow.name,
          rank: Ironsworn.rank[vow.data.data.rank],
          marks: vow.data.data.progress.value,
          text: vow.data.data.description.value
        };
        const html = await renderTemplate('systems/ironsworn/templates/dialog/vow-card.html', params);
        this.hoverCard = html;

        this.render(true);
      }, 500);
    });

    vowItems.on('mouseout', async (evt) => {
      evt.stopPropagation();

      clearTimeout(this.hoverTimeout);

      this.vowHoveredIdx = -1;

      // Hide hover card
      if (this.hoverCard) {
        delete this.hoverCard;

        this.render(true);
      }
    });

    // Assets
    const assetsHeader = html.find('.assets .lined-header .text');
    assetsHeader.on('click', async (evt) => {
      const { actor } = this;

      await actor.createOwnedItem({
        name: 'New Asset',
        type: 'asset',
        data: {}
      }, { renderSheet: true });
    });

    const assetItems = html.find('.assets .asset-list .asset-item > span');
    assetItems.on('click', async (evt) => {
      const { actor } = this;
      const target = evt.currentTarget;

      const asset = await actor.getOwnedItem(target.dataset.assetId);
      asset.sheet.render(true);
    });

    assetItems.on('contextmenu', async (evt) => {
      const { actor } = this;
      const target = evt.currentTarget;

      this.assetHoveredIdx = -1;
      delete this.hoverCard;

      await actor.deleteOwnedItem(target.dataset.assetId);
    });

    assetItems.on('mouseover', async (evt) => {
      clearTimeout(this.hoverTimeout);

      this.hoverTimeout = setTimeout(async () => {
        evt.stopPropagation();

        const { actor } = this;

        const target = evt.currentTarget;
        const { assetId } = target.dataset;
        const idx = parseInt(target.dataset.idx);

        // If we're not on this asset already, show its info card
        if (this.assetHoveredIdx === idx) {
          return;
        }

        const asset = actor.getOwnedItem(assetId);

        if (!asset) {
          return;
        }

        this.assetHoveredIdx = idx;
        this.assetAbilityIdx = 0;

        const abilities = asset.data.data.abilities.value;
        const ability = abilities[this.assetAbilityIdx];
        const pathType = Ironsworn.pathType[asset.data.data.type.value];

        const position = $(target).position();
        const params = {
          x: `${position.left - 125 + evt.offsetX}px`,
          y: `${position.top - 4}px`,
          name: asset.name,
          type: game.i18n.localize(`ironsworn.asset.type.${pathType}`),
          limit: asset.data.data.limit.value,
          acquired: ability && ability.acquired,
          ability: ability ? ability.description : '',
          page: abilities.length === 0 ? null : `${this.assetAbilityIdx + 1}/${abilities.length}`
        };
        const html = await renderTemplate('systems/ironsworn/templates/dialog/asset-card.html', params);
        this.hoverCard = html;

        this.render(true);
      }, 500);
    });

    assetItems.on('mouseout', async (evt) => {
      evt.stopPropagation();

      clearTimeout(this.hoverTimeout);

      this.assetHoveredIdx = -1;

      // Hide hover card
      if (this.hoverCard) {
        delete this.hoverCard;

        this.render(true);
      }
    });

    const gearHeader = html.find('.inventory .lined-header .text');
    gearHeader.on('click', async (evt) => {
      const { actor } = this;

      await actor.createOwnedItem({
        name: 'New Gear',
        type: 'equipment',
        data: {}
      }, { renderSheet: true });
    });

    const gearList = html.find('.equipment-list .gear');
    gearList.on('click', async (evt) => {
      const { actor } = this;

      const target = evt.currentTarget;
      const { gearId } = target.dataset;

      const gear = await actor.getOwnedItem(gearId);
      gear.sheet.render(true);
    });

    gearList.on('contextmenu', async (evt) => {
      const { actor } = this;

      const target = evt.currentTarget;
      const { gearId } = target.dataset;

      await actor.deleteOwnedItem(gearId);
    });

    gearList.on('mouseover', async (evt) => {
      clearTimeout(this.hoverTimeout);

      this.hoverTimeout = setTimeout(async () => {
        evt.stopPropagation();

        const { actor } = this;

        const target = evt.currentTarget;
        const { gearId } = target.dataset;
        const idx = parseInt(target.dataset.idx);

        // If we're not on this asset already, show its info card
        if (this.assetHoveredIdx === idx) {
          return;
        }

        const gear = actor.getOwnedItem(gearId);

        if (!gear) {
          return;
        }

        this.gearHoveredIdx = idx;

        const position = $(target).position();
        const params = {
          x: `${position.left - 125 + evt.offsetX}px`,
          y: `${position.top - 4}px`,
          name: gear.name,
          quantity: gear.data.data.quantity,
          description: gear.data.data.description.value
        };
        const html = await renderTemplate('systems/ironsworn/templates/dialog/gear-card.html', params);
        this.hoverCard = html;

        this.render(true);
      }, 500);
    });

    gearList.on('mouseout', async (evt) => {
      evt.stopPropagation();

      clearTimeout(this.hoverTimeout);

      this.gearHoveredIdx = -1;

      // Hide hover card
      if (this.hoverCard) {
        delete this.hoverCard;

        this.render(true);
      }
    });

    // Remove hover cards when the mouse leaves them
    if (this.hoverCard) {
      const dismissCard = async (evt) => {
        evt.stopPropagation();

        this.bondHoveredIdx = -1;
        this.vowHoveredIdx = -1;
        this.assetHoveredIdx = -1;

        delete this.hoverCard;

        this.render(true);
      };

      const cardEl = $('.hover-card');

      $('body').off('.hover');
      cardEl.off('.hover');

      cardEl.trigger('focus');

      cardEl.on('mouseleave.hover', async (evt) => {
        await dismissCard(evt);
      });

      cardEl.on('contextmenu.hover', async (evt) => {
        await dismissCard(evt);
      });

      if (this.assetHoveredIdx > -1) {
        const abilityScroll = async (evt, mod) => {
          evt.preventDefault();
          evt.stopPropagation();

          const assetEl = assetItems[this.assetHoveredIdx];
          const { assetId } = assetEl.dataset;

          const { actor } = this;
          const asset = actor.getOwnedItem(assetId);
          const abilities = asset.data.data.abilities.value;

          this.assetAbilityIdx = this.assetAbilityIdx + mod;
          if (this.assetAbilityIdx >= abilities.length) {
            this.assetAbilityIdx = 0;
          } else if (this.assetAbilityIdx < 0) {
            this.assetAbilityIdx = abilities.length - 1;
          }

          const ability = abilities[this.assetAbilityIdx];
          const pathType = Ironsworn.pathType[asset.data.data.type.value];

          const position = cardEl.position();
          const params = {
            x: `${position.left}px`,
            y: `${position.top}px`,
            name: asset.name,
            type: game.i18n.localize(`ironsworn.asset.type.${pathType}`),
            limit: asset.data.data.limit.value,
            acquired: ability && ability.acquired,
            ability: ability ? ability.description : '',
            page: abilities.length === 0 ? null : `${this.assetAbilityIdx + 1}/${abilities.length}`
          };
          const html = await renderTemplate('systems/ironsworn/templates/dialog/asset-card.html', params);
          this.hoverCard = html;

          this.render(true);
        };

        cardEl.on('wheel.hover', async (evt) => {
          const ctrlDown = evt.ctrlKey;

          if (ctrlDown) {
            const wheelEvt = evt.originalEvent as WheelEvent;
            await abilityScroll(evt, Math.sign(wheelEvt.deltaY));
          }
        });

        $('body').on('keydown.hover', async (evt) => {
          if (evt.key === 'ArrowLeft') {
            await abilityScroll(evt, -1);
          } else if (evt.key === 'ArrowRight') {
            await abilityScroll(evt, 1);
          }
        });
      }
    }
  }

  close(): Promise<void> {
    $('body').off('.character');
    $('body').off('.hover');

    return super.close();
  }
}
