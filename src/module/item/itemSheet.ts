import { Ironsworn } from "../config";

export class IronswornItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ironsworn", "sheet", "item"],
      width: 300,
      height: 200
    });
  }

  get template() {
    const path = "systems/ironsworn/templates/item";
    return `${path}/${this.item.data.type}-sheet.html`;
  }

  _bondData(data) {

  }

  _vowData(data) {
    data.ranks = Ironsworn.rank;

    const rankIdx = this.item.data.data.rank;
    let currentRank = 'troublesome';
    Ironsworn.rank.forEach((rank, idx) => {
      if (idx === rankIdx) {
        currentRank = rank;
        return false;
      }
    });
    data.currentRank = currentRank;
  }

  getData() {
    const data = super.getData();

    const { type } = this.item.data;
    switch (type) {
      case 'bond':
        this._bondData(data);
        break;

      case 'vow':
        this._vowData(data);
        break;
    }

    return data;
  }

  _bondListeners(html: JQuery) {
    const window = html.closest('.window-app');
    window.addClass('bond');
  }

  _vowListeners(html: JQuery) {
    const window = html.closest('.window-app');
    window.addClass('vow');

    const { item } = this;

    const ranks = html.find('.ranks input');
    ranks.on('change', async evt => {
      evt.preventDefault();

      const el = evt.currentTarget;

      await item.update({
        'data.rank': parseInt(el.dataset.rankIdx)
      });

      await this._onSubmit(evt);
    });

    const progressPips = html.find('.progress .pip');
    progressPips.on('mouseover', evt => {
      const target = evt.currentTarget;
      progressPips.each((idx, el) => {
        $(el).addClass('hover');

        if (el == target) {
          return false;
        }
      });
    });

    progressPips.on('mouseout', evt => {
      const target = evt.currentTarget;
      progressPips.each((idx, el) => {
        $(el).removeClass('hover');

        if (el == target) {
          return false;
        }
      });
    });

    progressPips.on('click', async (evt) => {
      const { item } = this;

      const btn = evt.button;
      const target = evt.currentTarget;

      if (btn === 0) {
        item.update({
          'data.progress.value': parseInt(target.dataset.idx) + 1
        })
      }
    });

    progressPips.on('contextmenu', async (evt) => {
      const { item } = this;

      item.update({
        'data.progress.value': 0
      });
    });
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);

    const { type } = this.item.data;
    switch (type) {
      case 'bond':
        this._bondListeners(html);
        break;

      case 'vow':
        this._vowListeners(html);
        break;
    }
  }
}
