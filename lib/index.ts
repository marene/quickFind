import * as Oni from 'oni-api';

import * as Strategies from './strategies'
import * as format from './format';

async function selectItemAndPopulateQuickFix(oni: Oni.Plugin.Api, quickFixEntry: Oni.QuickFixEntry): Promise<void> {
  try {
    const buffer = await oni.editors.openFile(quickFixEntry.filename);
    await buffer.setCursorPosition(quickFixEntry.lnum, quickFixEntry.col);
  } catch (err) {
    console.error({ err, quickFixEntry }, '[quickFind] failed to open selected item');
  }
}

function createQuickFindMenu (oni: Oni.Plugin.Api, strategy: Strategies.QuickFindStrategy): Oni.Menu.MenuInstance {
  const menu = oni.menu.create();

  menu.show();

  menu.onFilterTextChanged.subscribe((filterText: string) => {
    strategy.find(oni, filterText).then(menuOptions => {
      menu.setItems(menuOptions);
    });
  });

  menu.onItemSelected.subscribe(selectedItem => {
    const quickFixEntry = format.convertMenuOptionToQuickfixEntry(selectedItem);
    selectItemAndPopulateQuickFix(oni, quickFixEntry);
  });

  return menu;
}

export function activate(oni: Oni.Plugin.Api) {

  // I'm a bit worried by this, as strategy will be resolved everytime the command will be executed,
  // which means a file access attempt everytime.
  // On the other hand, it'll allow to check that we're still in a git repo consistently
  const quickFind = () => {
    const quickFindStrat = Strategies.factory().then(strat => {
      const menu = createQuickFindMenu(oni, strat);
    });
  }

  oni.commands.registerCommand({
    command: 'marene.quickFind',
    detail: 'A command to find strings in your current directory',
    execute: quickFind,
    name: 'quickFind'
  });
}
