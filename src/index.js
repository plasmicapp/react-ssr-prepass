// @flow

import { type Node, type Element } from 'react'
import type {
  Visitor,
  ClientReferenceVisitor,
  YieldFrame,
  Frame,
  AbstractElement,
  RendererState
} from './types'
import { visit, update, SHOULD_YIELD } from './visitor'
import { getChildrenArray } from './element'

import {
  setCurrentContextStore,
  setCurrentContextMap,
  setCurrentErrorFrame,
  getCurrentErrorFrame,
  setCurrentRendererState,
  initRendererState,
  Dispatcher,
  readContextValue,
  setContextValue
} from './internals'

/** visit() walks all elements (depth-first) and while it walks the
    element tree some components will suspend and put a `Frame` onto
    the queue. Hence we recursively look at suspended components in
    this queue, wait for their promises to resolve, and continue
    calling visit() on their children. */
const flushFrames = (
  queue: Frame[],
  visitor: Visitor,
  clientRefVisitor: ClientReferenceVisitor,
  state: RendererState
): Promise<void> => {
  const frame = queue.shift()
  if (!frame) {
    return Promise.resolve()
  }

  if (SHOULD_YIELD && frame.kind === 'frame.yield') {
    frame.thenable = new Promise((resolve, reject) => {
      setImmediate(resolve)
    })
  }

  return Promise.resolve(frame.thenable).then(
    () => {
      setCurrentRendererState(state)
      update(frame, queue, visitor, clientRefVisitor)
      return flushFrames(queue, visitor, clientRefVisitor, state)
    },
    (error: Error) => {
      if (!frame.errorFrame) throw error
      frame.errorFrame.error = error
      update(frame.errorFrame, queue, visitor, clientRefVisitor)
    }
  )
}

const defaultVisitor = () => undefined

declare var globalThis: any

let runningPrepassCount = 0

const renderPrepass = (
  element: Node,
  visitor?: Visitor,
  clientRefVisitor?: ClientReferenceVisitor
): Promise<void> => {
  if (!visitor) visitor = defaultVisitor
  if (!clientRefVisitor) clientRefVisitor = defaultVisitor

  const queue: Frame[] = []
  // Renderer state is kept globally but restored and
  // passed around manually since it isn't dependent on the
  // render tree
  const state = initRendererState()
  // Context state is kept globally and is modified in-place.
  // Before we start walking the element tree we need to reset
  // its current state
  setCurrentContextMap({})
  setCurrentContextStore(new Map())
  setCurrentErrorFrame(null)

  try {
    runningPrepassCount++
    globalThis.__ssrPrepassEnv = { readContextValue, setContextValue }
    visit(getChildrenArray(element), queue, visitor, clientRefVisitor)
  } catch (error) {
    runningPrepassCount--
    if (!runningPrepassCount) {
      delete globalThis.__ssrPrepassEnv
    }
    return Promise.reject(error)
  }

  return flushFrames(queue, visitor, clientRefVisitor, state).finally(() => {
    runningPrepassCount--
    if (!runningPrepassCount) {
      delete globalThis.__ssrPrepassEnv
    }
  })
}

export default renderPrepass
