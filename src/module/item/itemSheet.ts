import { Ironsworn } from "../config";

export class IronswornItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ironsworn", "sheet", "item"],
      width: 300,
      height: 200
    });
  }

  showEditor: boolean = false;
  editingAbilityIdx: number = -1;
  editingAbilityText: string;

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

  _assetData(data) {
    const { item } = this;

    data.types = Ironsworn.pathType;

    data.abilities = item.data.data.abilities.value.map((ability) => {
      const { description } = ability;

      const lines = description.split('\n');

      let numLines = lines.length;
      let inList = false;
      for (let i = 0; i < numLines; i++) {
        const line = lines[i];
        if (line.startsWith('* ')) {
          if (!inList) {
            lines.splice(i++, 0, '<ul>');
            numLines++;
            inList = true;
          }

          lines[i] = `<li>${line.substr(2).trim()}</li>`;
        } else if (inList) {
          lines.splice(i++, 0, '</ul>');
          numLines++;
          inList = false;
        }
      }

      return {
        ...ability,

        description: lines.join('\n')
      };
    });

    data.showEditor = this.showEditor;
    data.editingAbilityText = this.editingAbilityText;
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

      case 'asset':
        this._assetData(data);
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

  _assetListeners(html: JQuery) {
    const window = html.closest('.window-app');
    window.addClass('asset');

    const updateAcquired = async (evt, state) => {
      const { item } = this;
      const abilities = item.data.data.abilities.value.slice();

      const target = evt.currentTarget;
      const abilityEl = target.parentElement;
      const abilityIdx = abilityEl.dataset.idx;

      abilities[abilityIdx].acquired = state;

      await item.update({
        ['data.abilities.value']: abilities
      });

      await this._onSubmit(evt);
      this.render(true);
    };

    const setupEditor = () => {
      let keyUpTimeout;

      descEditor.find('textarea').on('keyup.editor', async (evt) => {
        const target = evt.currentTarget as HTMLTextAreaElement;
        const text = target.value;

        this.editingAbilityText = text;

        clearTimeout(keyUpTimeout);
        keyUpTimeout = setTimeout(() => {
          target.blur();
        }, 750);
      });

      descEditor.find('.actions .close').on('click.editor', async (evt) => {
        const { item } = this;
        const abilities = item.data.data.abilities.value.slice();

        abilities[this.editingAbilityIdx].description = this.editingAbilityText;

        await item.update({
          ['data.abilities.value']: abilities
        });

        this.showEditor = false;
        this.editingAbilityIdx = -1;
        delete this.editingAbilityText;

        descEditor.off('.editor');

        await this._onSubmit(evt);
      });
    };

    const descEditor = html.find('.ability-desc-editor');

    html.find('.ability-not-acquired').on('click', async (evt) => {
      updateAcquired(evt, true);
    });

    html.find('.ability-acquired').on('click', async (evt) => {
      updateAcquired(evt, false);
    });

    html.find('.ability-edit').on('click', async (evt) => {
      const { item } = this;
      const abilities = item.data.data.abilities.value;

      const target = evt.currentTarget;
      const abilityEl = target.parentElement;
      const abilityIdx = parseInt(abilityEl.dataset.idx);

      const ability = abilities[abilityIdx];

      this.showEditor = true;
      this.editingAbilityIdx = abilityIdx
      this.editingAbilityText = ability.description;

      this.render(true);
    });

    html.find('.add-ability').on('click', async (evt) => {
      const { item } = this;

      const abilities = item.data.data.abilities.value.slice();
      abilities.push({
        acquired: false,
        description: 'Ability Text\n* Test'
      });

      await item.update({
        ['data.abilities.value']: abilities
      });
    });

    if (this.showEditor) {
      setupEditor();
    }
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

      case 'asset':
        this._assetListeners(html);
        break;
    }
  }
}
