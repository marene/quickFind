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

const formatRawGrepResultsToQuickfixEntries = (rawGrepResults: string): Oni.QuickFixEntry[] => {
  const lines = rawGrepResults.split('\n');

  return lines.map(line => {
    const resultsMap = line.split(':');
    return {
      filename: resultsMap[0],
      lnum: parseInt(resultsMap[1], 10),
      text: resultsMap[2],
      col: 1
    };
  });
}

const gitGrep = async (oni: Oni.Plugin.Api, filterText: string): Promise<Oni.QuickFixEntry[]> => {
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

const populateMenu = (menu: Oni.Menu.MenuInstance, quickFindResults: Oni.QuickFixEntry[]): void => {
  const menuItems = [];
  for (let i = 0; i < quickFindResults.length && i < MAX_MENU_ITEMS; i++) {
    menuItems.push({
      label: `${quickFindResults[i].filename}:${quickFindResults[i].lnum}`,
      detail: quickFindResults[i].text
    });
  }
  menu.setItems(menuItems);
}

const createQuickFindMenu = (oni: Oni.Plugin.Api): Oni.Menu.MenuInstance => {
  const menu = oni.menu.create();

  menu.show();

  menu.onFilterTextChanged.subscribe((filterText: string) => {
    gitGrep(oni, filterText).then(res => {
      populateMenu(menu, res);
    });
  });

  menu.onItemSelected.subscribe(item => {
    console.log('onItemSelected => ', item);
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
