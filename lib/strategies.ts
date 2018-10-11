'use strict';

import * as Oni from 'oni-api';
import * as child_process from 'child_process';
import * as fs from 'fs';

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

export interface QuickFindResults {
  _rawResults: {fileName: string, lineNb: number, colNb: number, label: string}[];

  toQuickFixEntries(): Oni.QuickFixEntry[];
  toMenuOptions(): Oni.Menu.MenuOption[];
}

class GitGrepResults implements QuickFindResults {
  _rawResults: {fileName: string, lineNb: number, colNb: number, label: string}[];

  constructor(rawResults: string) {
    const lines = rawResults.split('\n');
    this._rawResults = lines.map(line => {
      const resultMap = line.split(':');
      return {
        fileName: resultMap[0],
        lineNb: parseInt(resultMap[1], 10) - 1,
        colNb: 0,
        label: resultMap[2]
      }
    });
  }

  toQuickFixEntries(): Oni.QuickFixEntry[] {
    return this._rawResults.map(rawResult => {
      return {
        filename: rawResult.fileName,
        lnum: rawResult.lineNb,
        col: rawResult.colNb,
        text: rawResult.label
      };
    });
  }

  toMenuOptions(): Oni.Menu.MenuOption[] {
    return this._rawResults.map(rawResult => {
      return {
        label: `${rawResult.fileName}:${rawResult.lineNb}`,
        detail: rawResult.label
      };
    });
  }
}

export interface QuickFindStrategy {
  find(oni: Oni.Plugin.Api, filterText: string): Promise<QuickFindResults>
}

class GitGrepStrategy implements QuickFindStrategy {
  async find(oni: Oni.Plugin.Api, filterText: string): Promise<QuickFindResults> {
    if (!filterText) return null;

    const command = `git grep -n ${filterText}`;

    try {
      const rawGrepResults = await executeCommand(command);

      return new GitGrepResults(rawGrepResults);
    } catch (err) {
      console.warn({ err, command }, '[quickFind] failed to execute command');
      return null;
    }
  }
}

class GrepStrategy implements QuickFindStrategy {
  async find(oni: Oni.Plugin.Api, filterText: string): Promise<QuickFindResults> {
    if (!filterText) return null;

    const command = `grep -rn ${filterText}`;

    try {
      const rawGrepResults = await executeCommand(command);

      return new GitGrepResults(rawGrepResults);
    } catch (err) {
      console.warn({ err, command }, '[quickFind] failed to execute command');
      return null;
    }
  }
}

export const strategyFactory = (path?: string): Promise<QuickFindStrategy> => {
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
