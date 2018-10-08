# quickFind
A simple async full-text search plugin for oni-vim editor

This plugin registers a command `marene.quickFind` that you can then bind to any mapping you like in your oni config file

# Installation
To install:
```
$> cd ~/.config/oni/plugins
$> git clone https://github.com/marene/quickFind
$> cd quickFind
$> npm run compile
```
Then bind a key map to `marene.quickFind` in your oni config file

# How does it work?
Invoke `marene.quickFind` command: As you type a string to search in the quickFind menu, quickFind will search for it using `git grep`, and prompt in real time the 10 first search results
On selection of an item, it will open the file at the right line number, and populate quick list with all found occurences

# Todo
 * Actually open file/ populate quick list at selection of an item (yeah, this is still a work in progress)
 * Fallback to non-git grepping strategy when not in a git repository
 * set the menu as `isLoading` when a grep process is active (handle concurrency between async processes)