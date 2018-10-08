'use strict';

import * as Oni from 'oni-api';

export function formatRawGrepResultsToQuickfixEntries(rawGrepResults: string): Oni.Menu.MenuOption[] {
  const lines = rawGrepResults.split('\n');

  return lines.map(line => {
    const resultsMap = line.split(':');

    const menuOption: Oni.Menu.MenuOption = {
      label: `${resultsMap[0]}:${resultsMap[1]}`,
      detail: resultsMap[2],
    };

    return menuOption;
  });
}

export function convertMenuOptionToQuickfixEntry(menuOption: Oni.Menu.MenuOption): Oni.QuickFixEntry {
  const splitLabel = menuOption.label.split(':');

  return {
    filename: splitLabel[0],
    lnum: parseInt(splitLabel[1], 10) - 1,
    col: 0,
    text: menuOption.detail
  }
}
