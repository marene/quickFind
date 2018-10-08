import * as Oni from 'oni-api';
import * as child_process from 'child_process';

const MAX_MENU_ITEMS = 10;

const executeCommand = (args: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    child_process.exec(args, {}, (error, stdout, stderr) => {
      if (error) {
        return reject({
          error,
          stderr
        });
      }

      return resolve(stdout);
    });
  });
}

const formatRawGrepResultsToQuickfixEntries = (rawGrepResults: string): Oni.Menu.MenuOption[] => {
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

const gitGrep = async (oni: Oni.Plugin.Api, filterText: string): Promise<Oni.Menu.MenuOption[]> => {
  if (!filterText) return;
  const command = `git grep -n ${filterText}`;
  try {
    const rawGrepResults = await executeCommand(command);
    const formattedGrepResults = formatRawGrepResultsToQuickfixEntries(rawGrepResults);

    return formattedGrepResults;
  } catch (err) {
    console.warn({ err, command }, '[quickFind] failed to execute command');
    return [];
  }
}

const convertMenuOptionToQuickfixEntry = (menuOption: Oni.Menu.MenuOption): Oni.QuickFixEntry => {
  const splitLabel = menuOption.label.split(':');

  return {
    filename: splitLabel[0],
    lnum: parseInt(splitLabel[1], 10) - 1,
    col: 0,
    text: menuOption.detail
  }
}

const selectItemAndPopulateQuickFix = async (oni: Oni.Plugin.Api, quickFixEntry: Oni.QuickFixEntry): Promise<void> =>  {
  try {
    const buffer = await oni.editors.openFile(quickFixEntry.filename);
    await buffer.setCursorPosition(quickFixEntry.lnum, quickFixEntry.col);
  } catch (err) {
    console.error({ err, quickFixEntry }, '[quickFind] failed to open selected item');
  }
}

const createQuickFindMenu = (oni: Oni.Plugin.Api): Oni.Menu.MenuInstance => {
  const menu = oni.menu.create();

  menu.show();

  menu.onFilterTextChanged.subscribe((filterText: string) => {
    gitGrep(oni, filterText).then(menuOptions => {
      menu.setItems(menuOptions.splice(0, MAX_MENU_ITEMS));
    });
  });

  menu.onItemSelected.subscribe(selectedItem => {
    const quickFixEntry = convertMenuOptionToQuickfixEntry(selectedItem);
    selectItemAndPopulateQuickFix(oni, quickFixEntry);
  });

  return menu;
}

export const activate = (oni: Oni.Plugin.Api) => {

  const quickFind = () => {
    /*
     *gitGrep(oni).then(quickfixEntries => {
     *  oni.populateQuickFix(quickfixEntries);
     *});
     */
    const menu = createQuickFindMenu(oni);
  }

  oni.commands.registerCommand({
    command: 'marene.quickFind',
    detail: 'A command to find strings in your current directory',
    execute: quickFind,
    name: 'quickFind'
  });

  console.log('TEST ACTIVATED')
}
