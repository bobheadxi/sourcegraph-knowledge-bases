import { ExtensionContext, languages } from 'sourcegraph'

import {HoverProvider} from './hover'

export function activate(context: ExtensionContext): void {
    console.log('Activating bobheadxi/sourcegraph-knowledge-base')

    context.subscriptions.add(
        languages.registerHoverProvider([{ language: 'markdown' }], HoverProvider)
    )
}

// Sourcegraph extension documentation: https://docs.sourcegraph.com/extensions/authoring
