'use strict';

import * as Oni from 'oni-api';
import * as child_process from 'child_process';
import * as fs from 'fs';

import {formatRawGrepResultsToQuickfixEntries} from './format';

function executeCommand(args: string): Promise<string> {
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

export interface QuickFindStrategy {
  find(oni: Oni.Plugin.Api, filterText: string): Promise<Oni.Menu.MenuOption[]>
}

class GitGrepStrategy implements QuickFindStrategy {
  async find(oni: Oni.Plugin.Api, filterText: string): Promise<Oni.Menu.MenuOption[]> {
    if (!filterText) return [];

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
}

class GrepStrategy implements QuickFindStrategy {
  async find(oni: Oni.Plugin.Api, filterText: string): Promise<Oni.Menu.MenuOption[]> {
    if (!filterText) return [];

    const command = `grep -n ${filterText}`;

    try {
      const rawGrepResults = await executeCommand(command);
      const formattedGrepResults = formatRawGrepResultsToQuickfixEntries(rawGrepResults);

      return formattedGrepResults;
    } catch (err) {
      console.warn({ err, command }, '[quickFind] failed to execute command');
      return [];
    }
  }
}

export const factory = (path?: string): Promise<QuickFindStrategy> => {
  return new Promise(resolve => {
    const _path = (path || '.') + '/.git';

    fs.access(_path, fs.constants.F_OK, err => {
      if (err) {
        console.log({ path },'[quickFind.strategies] no .git dir found in path, resolving to non-git strategy');
        return resolve(new GrepStrategy());
      }
      console.log({ path }, '[quickFind.strategies] found .git dir in path, resolving to git strategy');
      return resolve(new GitGrepStrategy());
    });
  });
}
