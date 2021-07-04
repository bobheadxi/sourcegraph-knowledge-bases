import * as sourcegraph from 'sourcegraph'

const MAX_WIKILINK_SCAN = 150

export const HoverProvider: sourcegraph.HoverProvider = {
    async provideHover(document, hover): Promise<sourcegraph.Badged<sourcegraph.Hover> | null>{
        // Scan big chunk of line for a potential wikilink
        const scanLeft = new sourcegraph.Position(hover.line, Math.max(hover.character - MAX_WIKILINK_SCAN/2, 0))
        const maybeWikilinkInRange = new sourcegraph.Range(
            scanLeft,
            new sourcegraph.Position(hover.line, hover.character + MAX_WIKILINK_SCAN/2)
        )
        const maybeWikilinkInText = document.getText(document.validateRange(maybeWikilinkInRange))
        if (!maybeWikilinkInText) { return null }

        let leftBrace = 0
        let rightBrace = 0
        const leftBraces: { index: number, pair: boolean }[] = []
        for (let index = 0; index < maybeWikilinkInText.length-1; index += 1 ) {
            if (maybeWikilinkInText[index] === '[') {
                if (index + scanLeft.character > hover.character) { break }
                if (leftBraces.length > 0 && leftBraces[leftBraces.length-1].index === index - 1) {
                    leftBraces[leftBraces.length-1].pair = true
                } else {
                    leftBraces.push({ index, pair: false })
                }
            } else if (maybeWikilinkInText[index] === ']') {
                if (index + scanLeft.character < hover.character) { continue }
                if (maybeWikilinkInText[index+1] === ']') {
                    const left = leftBraces.pop()
                    if (!left || !left.pair) { break }
                    leftBrace = left.index + scanLeft.character
                    rightBrace = index + 1 + scanLeft.character
                    break
                }
            }
        }
        if (leftBrace === 0 || rightBrace === 0) {
            return null
        }

        // Get wikilink (including the brackets)
        const wikilinkRange = new sourcegraph.Range(new sourcegraph.Position(hover.line, leftBrace), new sourcegraph.Position(hover.line, rightBrace + 1))
        const wikilink = document.getText(wikilinkRange)
        if (!wikilink) { throw new Error('where is my text buddy?') }

        // Generate a query for the wikilink
        const [link, alias] = wikilink.slice(2, -3).split('|')
        const escapedPath = link.replace(/\s/g, '\\ ')
        sourcegraph.app.log('Discovered wikilink', { wikilink, link, alias, escapedPath })
        // TODO this URI is not supposed to be depended on but there doesn't seem to be
        // a better way to figure out where I am so... oh well?
        const rootURI = sourcegraph.workspace.roots[0].uri
        const workspaceContext = `repo:${rootURI.host}${rootURI.pathname}`
        // Potential anchorlink solution: ${anchorSplit.length > 1 ? `# ${anchorSplit[1]} :[_] patternType:structural` : ''}
        const linkQuery = `${workspaceContext} (type:file file:/${escapedPath}.md$ OR file:^${escapedPath}.md$)`
        sourcegraph.app.log('Looking for wikilink target', { linkQuery })

        const queryResponse = await sourcegraph.graphQL.execute(`
          query Search($query: String) {
            search(version: V2, query: $query) {
              results {
                matchCount
                results {
                  __typename
                  ... on FileMatch {
                    file {
                      path
                      name
                      url
                      content
                    }
                  }
                }
              }
            }
          }
        `, { query: linkQuery })
        if (queryResponse.errors) {
            return {
                range: wikilinkRange,
                contents: {
                    value: `Failed to fetch links: ${queryResponse.errors.map(error => error.message).join(', ')}`,
                },
            }
        }
        const data = queryResponse.data as { search: { results: { matchCount: number, results: { file: { path: string, url: string, content: string} }[] }}}
        const { search: { results: { matchCount, results }}} = data
        if (matchCount === 0) {
            return {
                range: wikilinkRange,
                contents: {
                    value: 'No links found'
                },
            }
        }
        if (matchCount > 1) {
            return {
                range: wikilinkRange,
                contents: {
                    value: `${matchCount} conflicting links found: ${results.map(match => `\`${match.file.path}\``).join(', ')}`,
                },
            }
        }

        const exactMatch = data.search.results.results[0]
        return {
            range: wikilinkRange,
            contents: {
                // TODO: trim out frontmatter before render
                value: `**${alias || link}** ([\`${exactMatch.file.path}\`](${exactMatch.file.url}))\n\n---\n\n${exactMatch.file.content}`,
                kind: sourcegraph.MarkupKind.Markdown,
            },
        }
    }
}
