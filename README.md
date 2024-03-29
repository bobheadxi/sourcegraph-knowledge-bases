# Sourcegraph knowledge bases extension

> ⚠️ Sourcegraph extensions have been [deprecated with the September 2022 Sourcegraph
release](https://docs.sourcegraph.com/extensions/deprecation).

Browse Markdown knowledge bases (e.g. [Obsidian vaults](https://obsidian.md/) or [Foam repositories](https://github.com/foambubble/foam/)) in [Sourcegraph](https://about.sourcegraph.com/).

[**Enable on Sourcegraph.com →**](https://sourcegraph.com/extensions/bobheadxi/sourcegraph-knowledge-bases)

![Sourcegraph extension](https://github.com/bobheadxi/sourcegraph-knowledge-bases/blob/master/.static/feature.png?raw=true)

## Roadmap

- Hovers
  - [x] Preview and link to `[[LINK]]` and `[[LINK|ALIAS]]`  Wikilinks
  - [ ] Preview and link anchored `[[LINK#ANCHOR]]` Wikilinks
  - [ ] Metadata and links for `#TAG`s
- Side panes
  - [ ] Browse inbound (backlinks) and outbound links
  - [ ] Browse `#TAG`s in side panes

## Current limitations

The Sourcegraph extensions API currently doesn't seem to enable hovers on Markdown previews, so you must toggle off previews for this extension to work at the moment.
