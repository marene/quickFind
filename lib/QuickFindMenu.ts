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

    this._oniMenu.onFilterTextChanged.subscribe((filterText: string) => {
      this._strategy.find(this._oni, filterText).then(results => {
        if (results) {
          this._findResults = results;
          this._oniMenu.setItems(this._findResults.toMenuOptions());
        }
      });
    });

    this._oniMenu.onItemSelected.subscribe(selectedItem => {
      const quickFixEntry = Format.convertMenuOptionToQuickfixEntry(selectedItem);
      this.selectItemAndPopulateQuickFix(quickFixEntry);
    });
  }

  async selectItemAndPopulateQuickFix(selected: Oni.QuickFixEntry): Promise<void> {
    try {
      const buffer = await this._oni.editors.openFile(
        selected.filename);
      await buffer.setCursorPosition(selected.lnum, selected.col);

      if (this._findResults) {
        this._oni.populateQuickFix(this._findResults.toQuickFixEntries());
      }
    } catch (err) {
      console.error({ err, selected }, '[quickFind] failed to open selected item');
    }
  }

  activateMenu(): void {
    if (this._oniMenu) {
      this._oniMenu.setItems([]);
      this._oniMenu.show();
    }
  }
}
