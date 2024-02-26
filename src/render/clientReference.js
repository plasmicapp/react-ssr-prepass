// @flow

import React, { type Node, type ComponentType, createElement } from 'react'
import { computeProps, getChildrenArray, typeOf } from '../element'

import type {
  Visitor,
  Hook,
  Frame,
  DefaultProps,
  ComponentStatics,
  UserElement,
  ClientReference,
  ClientReferenceElement,
  ClientReferenceVisitor,
  ClientRefFrame
} from '../types'

import {
  type Identity,
  maskContext,
  makeIdentity,
  setCurrentIdentity,
  getCurrentIdentity,
  setCurrentContextStore,
  getCurrentContextStore,
  setCurrentContextMap,
  getCurrentContextMap,
  setCurrentErrorFrame,
  getCurrentErrorFrame,
  renderWithHooks,
  setFirstHook,
  getFirstHook
} from '../internals'
import { getComponentName } from '../utils'

// When rendering RSC, we cannot access client components directly and only
// see a client reference. We support using a visitor instead to behave as the
// client component would, possibly throwing promises, using hooks or contexts
// (whose read/write functions are exposed via `globalThis.__ssrPrepassEnv`),
// and returning a new node element.
const render = (
  type: ClientReference,
  props: DefaultProps,
  queue: Frame[],
  clientRefVisitor: ClientReferenceVisitor,
  element: ClientReferenceElement
): Node => {
  try {
    const node = clientRefVisitor((element: any))
    // We cannot access client component references in RSC phase, so we just
    // render the props (or whatever node has been returned by the visitor)
    return createElement(React.Fragment, ({}: any), [
      ...(node
        ? getChildrenArray((node: any))
        : (Object.values(props)
            .flat(Infinity)
            .filter(
              (elt) => elt && typeof elt === 'object' && typeOf((elt: any))
            ): any))
    ])
  } catch (error) {
    if (typeof error.then !== 'function') {
      console.warn(
        `PLASMIC: Encountered error when pre-rendering client reference: ${error}`
      )
      return null
    }

    queue.push({
      contextMap: getCurrentContextMap(),
      contextStore: getCurrentContextStore(),
      errorFrame: getCurrentErrorFrame(),
      id: getCurrentIdentity(),
      hook: getFirstHook(),
      thenable: error,
      kind: 'client-ref',
      type,
      props,
      element,
      clientRefVisitor
    })
    return null
  }
}

export const mount = (
  type: ClientReference,
  props: DefaultProps,
  queue: Frame[],
  clientRefVisitor: ClientReferenceVisitor,
  element: ClientReferenceElement
): Node => {
  setFirstHook(null)
  setCurrentIdentity(makeIdentity())

  return render(type, props, queue, clientRefVisitor, element)
}

export const update = (queue: Frame[], frame: ClientRefFrame): Node => {
  setFirstHook(frame.hook)
  setCurrentIdentity(frame.id)
  setCurrentContextMap(frame.contextMap)
  setCurrentContextStore(frame.contextStore)
  setCurrentErrorFrame(frame.errorFrame)
  return render(
    frame.type,
    frame.props,
    queue,
    frame.clientRefVisitor,
    frame.element
  )
}
