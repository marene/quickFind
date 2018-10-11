import * as Oni from 'oni-api';

import * as Strategies from './strategies'
import {QuickFindMenu} from './QuickFindMenu';

export function activate(oni: Oni.Plugin.Api) {

  const quickFind = () => {
  const quickFindStrat = Strategies.strategyFactory().then(strat => {
    const quickFindMenu = new QuickFindMenu(oni, strat);
    quickFindMenu.activateMenu();
  });
  }

    oni.commands.registerCommand({
      command: 'marene.quickFind',
      detail: 'A command to find strings in your current directory',
      execute: quickFind,
      name: 'quickFind'
    });
}
