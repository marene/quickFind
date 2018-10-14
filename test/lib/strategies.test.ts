'use strict';

import {describe, it} from 'mocha';
import {expect} from 'chai';

import {GitGrepResults} from '../../lib/strategies';

describe('strategies', () => {
  describe('QuickFindResults interface', () => {
    describe('GitGrepResults class', () => {
      it('should parse a valid git grep output', () => {
        const validGitGrepOutput = '/path/to/file:1:   foo:bar\n/path/to/file:43: foo';

        const result = new GitGrepResults(validGitGrepOutput);

        expect(result._rawResults).to.deep.equal([
          {
            fileName: '/path/to/file',
            lineNb: 0,
            colNb: 0,
            label: '   foo:bar'
          },
          {
            fileName: '/path/to/file',
            lineNb: 42,
            colNb: 0,
            label: ' foo'
          }
        ]);
      });

      it('should silently ignore invalid lines', () => {
        const validGitGrepOutput = '/path/to/file:1:   foo:bar\nnon-valid-line\n\n/path/to/file:43: foo';

        const result = new GitGrepResults(validGitGrepOutput);

        expect(result._rawResults).to.deep.equal([
          {
            fileName: '/path/to/file',
            lineNb: 0,
            colNb: 0,
            label: '   foo:bar'
          },
          {
            fileName: '/path/to/file',
            lineNb: 42,
            colNb: 0,
            label: ' foo'
          }
        ]);
      });

      it('should convert raw results to a valid instance of MenuOption[]', () => {
        const validGitGrepOutput = '/path/to/file:1:   foo:bar\n/path/to/file:43: foo';
        const result = new GitGrepResults(validGitGrepOutput);

        const menuOptions = result.toMenuOptions();

        expect(menuOptions).to.deep.equal([
          {
            label: '   foo:bar',
            detail: '/path/to/file:1',
            metadata: {
              jumpId: ':1'
            },
          },
          {
            label: ' foo',
            detail: '/path/to/file:43',
            metadata: {
              jumpId: ':2'
            },
          }
        ]);
      });

      it('should convert raw results to a valid instance of QuickFixEntry[]', () => {
        const validGitGrepOutput = '/path/to/file:1:   foo:bar\n/path/to/file:43: foo';
        const result = new GitGrepResults(validGitGrepOutput);

        const quickFixEntries = result.toQuickFixEntries();

        expect(quickFixEntries).to.deep.equal([
          {
            filename: '/path/to/file',
            lnum: 1,
            col: 0,
            text: '   foo:bar'
          },
          {
            filename: '/path/to/file',
            lnum: 43,
            col: 0,
            text: ' foo'
          }
        ]);
      });
    });
  });
});
