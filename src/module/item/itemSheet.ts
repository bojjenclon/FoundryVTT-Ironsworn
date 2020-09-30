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
      return {
        ...ability,

        description: item.assetAbilityHtml(ability)
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

  caretPosition: number = 0;
  isBlurred: boolean = false;
  keyUpTimeout: number;

  _assetListeners(html: JQuery) {
    const window = html.closest('.window-app');
    window.addClass('asset');

    const updateAcquired = async (evt, state) => {
      const { item } = this;
      const abilities = duplicate(item.data.data.abilities.value ?? []);

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

    const closeEditor = async (evt) => {
      const { item } = this;
      const abilities = duplicate(item.data.data.abilities.value ?? []);

      abilities[this.editingAbilityIdx].description = this.editingAbilityText;

      this.showEditor = false;
      this.editingAbilityIdx = -1;
      delete this.editingAbilityText;

      $(document).off('.editor');
      descEditor.off('.editor');

      await item.update({
        ['data.abilities.value']: abilities
      });

      await this._onSubmit(evt);
    };

    const setupEditor = () => {
      const textArea = descEditor.find('textarea');

      $(document).off('.editor');
      descEditor.off('.editor');

      $(document).on('keydown.editor', async (evt) => {
        if (this.keyUpTimeout) {
          clearTimeout(this.keyUpTimeout);
        }

        if (this.isBlurred) {
          this.isBlurred = false;
          textArea.trigger('focus');
          textArea.prop('selectionStart', this.caretPosition);
          textArea.prop('selectionEnd', this.caretPosition);
        }
      });

      textArea.on('keyup.editor', async (evt) => {
        if (evt.key === 'Escape') {
          closeEditor(evt);
          return;
        }

        const text = textArea.val() as string;

        this.editingAbilityText = text;

        clearTimeout(this.keyUpTimeout);
        this.keyUpTimeout = setTimeout(() => {
          this.isBlurred = true;
          this.caretPosition = textArea.prop('selectionEnd');
          textArea.trigger('blur');
        }, 750);
      });

      textArea.on('mouseup.editor', async (evt) => {
        clearTimeout(this.keyUpTimeout);

        this.caretPosition = textArea.prop('selectionEnd');
      });

      descEditor.find('.actions .close').on('click.editor', async (evt) => {
        closeEditor(evt);
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

    html.find('.ability-delete').on('click', async (evt) => {
      const { item } = this;
      const abilities = duplicate(item.data.data.abilities.value ?? []);

      const target = evt.currentTarget;
      const abilityEl = target.parentElement;
      const abilityIdx = parseInt(abilityEl.dataset.idx);

      abilities.splice(abilityIdx, 1);

      await item.update({
        ['data.abilities.value']: abilities
      });
    });

    html.find('.add-ability').on('click', async (evt) => {
      const { item } = this;
      const abilities = duplicate(item.data.data.abilities.value ?? []);

      abilities.push({
        // The first ability is usually automatically acquired
        acquired: abilities.length === 0,
        description: 'Ability Text'
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
