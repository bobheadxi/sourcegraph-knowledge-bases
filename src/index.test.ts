import mock from 'mock-require'

import { createStubSourcegraphAPI, createStubExtensionContext } from '@sourcegraph/extension-api-stubs'
const sourcegraph = createStubSourcegraphAPI()
mock('sourcegraph', sourcegraph)

import { activate } from '.'

describe('sourcegraph-knowledge-base', () => {
    it('should activate successfully', () => {
        const context = createStubExtensionContext()
        activate(context)
    })
})
