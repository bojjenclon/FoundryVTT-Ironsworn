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

    data.abilities = item.data.data.abilities.value;

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
  }

  _vowListeners(html: JQuery) {
    const { item } = this;

    const ranks = html.find('.ranks input');
    ranks.on('change', async evt => {
      evt.preventDefault();

      const el = evt.currentTarget;

      await item.update({
        'data.rank': parseInt(el.dataset.rankIdx)
      });

      this.render(true);
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
  editorBlurTimeout: number;

  _assetListeners(html: JQuery) {
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

      this.render(true);
    };

    const descEditor = html.find('.ability-desc-editor');

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

      this.render(true);
    };

    const setupEditor = () => {
      const textArea = descEditor.find('textarea');
      const generateTimeout = () => {
        return setTimeout(() => {
          this.isBlurred = true;
          this.caretPosition = textArea.prop('selectionEnd');
          textArea.trigger('blur');
        }, 750);
      };

      $(document).off('.editor');
      descEditor.off('.editor');

      $(document).on('keydown.editor', async (evt) => {
        if (this.editorBlurTimeout) {
          clearTimeout(this.editorBlurTimeout);
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

        clearTimeout(this.editorBlurTimeout);
        this.editorBlurTimeout = generateTimeout();
      });

      textArea.on('mouseup.editor', async (evt) => {
        this.caretPosition = textArea.prop('selectionEnd');

        clearTimeout(this.editorBlurTimeout);
        this.editorBlurTimeout = generateTimeout();
      });

      descEditor.find('.actions .close').on('click.editor', async (evt) => {
        closeEditor(evt);
      });
    };

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

  _equipmentListeners(html: JQuery) {
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);

    const { type } = this.item.data;

    const window = html.closest('.window-app');
    window.addClass(type);

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

      case 'equipment':
        this._equipmentListeners(html);
        break;
    }
  }

  close() {
    if (this.showEditor) {
      this.showEditor = false;
      this.editingAbilityIdx = -1;
      delete this.editingAbilityText;
    }

    return super.close();
  }
}
