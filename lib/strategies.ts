'use strict';

import * as Oni from 'oni-api';
import * as child_process from 'child_process';
import * as fs from 'fs';

function buildStringArgs(args: string[]): string {
  return args.map(arg => `"${arg.replace('"', '\\"')}"`).join(' ');
}

function pipeCommands(commands: string[]): string {
  return commands.join(' | ');
}

function executeCommand(args: string): Promise<string> {
  return new Promise((resolve, reject) => {
    child_process.exec(args, {}, (error, stdout, stderr) => {
      if (error) {
        console.error({ error, args }, '[quickFind.executeCommand] failed to execute command');
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
  // lineNb and colNb are ZERO BASED
  _rawResults: {fileName: string, lineNb: number, colNb: number, label: string}[];

  toQuickFixEntries(): Oni.QuickFixEntry[];
  toMenuOptions(): Oni.Menu.MenuOption[];
}

export class GitGrepResults implements QuickFindResults {
  _rawResults: {fileName: string, lineNb: number, colNb: number, label: string}[];

  constructor(rawResults: string) {
    const lines = rawResults.split('\n');
    const resultsArray = lines.map(line => {
      const resultMap = line.match(/^([^:]+):([0-9]+):(.*)$/);
      if (resultMap === null) return null;
      return {
        fileName: resultMap[1],
        lineNb: parseInt(resultMap[2], 10) - 1,
        colNb: 0,
        label: resultMap[3]
      }
    });
    this._rawResults = resultsArray.filter(result => result !== null);
  }

  toQuickFixEntries(): Oni.QuickFixEntry[] {
    return this._rawResults.map(rawResult => {
      return {
        filename: rawResult.fileName,
        lnum: rawResult.lineNb + 1,
        col: rawResult.colNb,
        text: rawResult.label
      };
    });
  }

  toMenuOptions(): Oni.Menu.MenuOption[] {
    return this._rawResults.map((rawResult, index) => {
      return {
        label: rawResult.label,
        detail: `${rawResult.fileName}:${rawResult.lineNb + 1}`,
        metadata: {
          jumpId: `:${index + 1}`
        },
      };
    });
  }
}

export interface QuickFindStrategy {
  find(oni: Oni.Plugin.Api, filterText: string): Promise<QuickFindResults>
}

class GitGrepStrategy implements QuickFindStrategy {
  _MAX_LINES_NB_OUTPUT = 100;

  async find(oni: Oni.Plugin.Api, filterText: string): Promise<QuickFindResults> {
    if (!filterText) return null;

    const gitGrepCommand = buildStringArgs(['git', 'grep', '-n', filterText]);
    const headCommand = buildStringArgs(["head", `-n${this._MAX_LINES_NB_OUTPUT}`]);
    const command = pipeCommands([gitGrepCommand, headCommand]);

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
  _MAX_LINES_NB_OUTPUT = 100;

  async find(oni: Oni.Plugin.Api, filterText: string): Promise<QuickFindResults> {
    if (!filterText) return null;

    const command = buildStringArgs(['grep', '-rn', '-m', String(this._MAX_LINES_NB_OUTPUT), filterText]);

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
        return resolve(new GrepStrategy());
      }
      return resolve(new GitGrepStrategy());
    });
  });
}
