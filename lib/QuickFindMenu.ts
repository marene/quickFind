'use strict';

import *  as Oni from 'oni-api';

import * as Strategies from './strategies';
import * as Format from './format';

export class QuickFindMenu {
  _oni: Oni.Plugin.Api;
  _oniMenu: Oni.Menu.MenuInstance;
  _findResults: Strategies.QuickFindResults;
  _strategy: Strategies.QuickFindStrategy;

  constructor(oni: Oni.Plugin.Api, strategy: Strategies.QuickFindStrategy) {
    this._oni = oni;
    this._oniMenu = oni.menu.create();
    this._strategy = strategy;
    this._findResults = null;

    this._oniMenu.setFilterFunction((items: Oni.Menu.MenuOption[], searchString: string): Oni.Menu.IMenuOptionWithHighlights[] => {
      return items.map(item => {
        const labelHighlights = new Array(searchString.length);
        const indexOfSearchString = item.label.indexOf(searchString);
        for (let i = 0; i < searchString.length; i++) {
          labelHighlights[i] = indexOfSearchString + i;
        }

        const ret = Object.assign(
          {
            labelHighlights,
            detailHighlights: [],
          },
          item
        );
        return ret;
      });
    });

    this._oniMenu.onFilterTextChanged.subscribe((filterText: string) => {
      this._strategy.find(this._oni, filterText).then(results => {
        if (results) {
          this._findResults = results;
          this._oniMenu.setItems(this._findResults.toMenuOptions());
        } else {
          this._findResults = null;
          this._oniMenu.setItems([]);
        }
      });
    });

    this._oniMenu.onItemSelected.subscribe(selectedItem => {
      this.selectItemAndPopulateQuickFix(selectedItem);
    });
  }

  async selectItemAndPopulateQuickFix(selected: Oni.Menu.MenuOption): Promise<void> {
    const quickFixEntry = Format.convertMenuOptionToQuickfixEntry(selected);
    try {
      console.log('=====>', quickFixEntry);
      const buffer = await this._oni.editors.openFile(quickFixEntry.filename);
      await buffer.setCursorPosition(quickFixEntry.lnum, quickFixEntry.col);

      if (this._findResults) {
        this._oni.populateQuickFix(this._findResults.toQuickFixEntries());
        this._oni.editors.activeEditor.neovim.command(':copen');
        this._oni.editors.activeEditor.neovim.command(selected.metadata.jumpId);
      }
    } catch (err) {
      console.error({ err, selected, quickFixEntry }, '[quickFind] failed to open selected item');
    }
  }

  activateMenu(): void {
    if (this._oniMenu) {
      this._oniMenu.setItems([]);
      this._oniMenu.show();
    }
  }
}
