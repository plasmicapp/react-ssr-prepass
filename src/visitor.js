// @flow

import React, { type Node, type ComponentType, createElement } from 'react'

import {
  typeOf,
  shouldConstruct,
  getChildrenArray,
  computeProps
} from './element'

import {
  mountFunctionComponent,
  updateFunctionComponent,
  mountClassComponent,
  updateClassComponent,
  mountLazyComponent,
  updateLazyComponent,
  mountClientReference,
  updateClientReference
} from './render'

import type {
  Visitor,
  ClientReferenceVisitor,
  YieldFrame,
  ClassFrame,
  Frame,
  ContextMap,
  ContextEntry,
  DefaultProps,
  ComponentStatics,
  LazyElement,
  AbstractElement,
  ConsumerElement,
  ProviderElement,
  FragmentElement,
  SuspenseElement,
  ForwardRefElement,
  MemoElement,
  UserElement,
  DOMElement,
  ClientReferenceElement,
  ClientReference
} from './types'

import {
  getCurrentContextMap,
  getCurrentContextStore,
  setCurrentContextMap,
  setCurrentContextStore,
  flushPrevContextMap,
  flushPrevContextStore,
  restoreContextMap,
  restoreContextStore,
  readContextValue,
  setContextValue,
  setCurrentIdentity,
  setCurrentErrorFrame,
  getCurrentErrorFrame,
  Dispatcher,
  setFirstHook,
  getCurrentIdentity,
  getFirstHook
} from './internals'

import {
  REACT_ELEMENT_TYPE,
  REACT_TRANSITIONAL_ELEMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_CONCURRENT_MODE_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
  REACT_CONSUMER_TYPE
} from './symbols'

import { isClientReference, isReact19 } from './utils'

const REACT_INTERNALS =
  (React: any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ||
  (React: any)
    .__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
  (React: any).__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE

const ReactCurrentDispatcher =
  REACT_INTERNALS.ReactCurrentDispatcher || REACT_INTERNALS

const getReactCurrentDispatcher = () => {
  return ReactCurrentDispatcher.current || ReactCurrentDispatcher.H
}

const injectReactCurrentDispatcher = (newDispatcher) => {
  if (!isReact19()) {
    ReactCurrentDispatcher.current = newDispatcher
  } else {
    ReactCurrentDispatcher.H = newDispatcher
  }
}

// In the presence of setImmediate, i.e. on Node, we'll enable the
// yielding behavior that gives the event loop a chance to continue
// running when the prepasses would otherwise take too long
export const SHOULD_YIELD = typeof setImmediate === 'function'
// Time in ms after which the otherwise synchronous visitor yields so that
// the event loop is not interrupted for too long
const YIELD_AFTER_MS = 5

const render = (
  type: (ComponentType<DefaultProps> & ComponentStatics) | ClientReference,
  props: DefaultProps,
  queue: Frame[],
  visitor: Visitor,
  clientRefVisitor: ClientReferenceVisitor,
  element: UserElement | ClientReferenceElement
) => {
  if (isClientReference(type)) {
    return mountClientReference(
      (type: any),
      props,
      queue,
      clientRefVisitor,
      (element: any)
    )
  }
  return shouldConstruct((type: any))
    ? mountClassComponent((type: any), props, queue, visitor, (element: any))
    : mountFunctionComponent((type: any), props, queue, visitor, (element: any))
}

export const visitElement = (
  element: AbstractElement,
  queue: Frame[],
  visitor: Visitor,
  clientRefVisitor: ClientReferenceVisitor
): AbstractElement[] => {
  switch (typeOf(element)) {
    case REACT_SUSPENSE_TYPE:
    case REACT_STRICT_MODE_TYPE:
    case REACT_CONCURRENT_MODE_TYPE:
    case REACT_PROFILER_TYPE:
    case REACT_FRAGMENT_TYPE: {
      // These element types are simply traversed over but otherwise ignored
      const fragmentElement = ((element: any):
        | FragmentElement
        | SuspenseElement)
      return getChildrenArray(fragmentElement.props.children)
    }

    case REACT_PROVIDER_TYPE: {
      const providerElement = ((element: any): ProviderElement)
      // Add provider's value prop to context
      const { value, children } = providerElement.props
      const type = (providerElement.type: any)
      const context = typeof type._context === 'object' ? type._context : type
      setContextValue(context, value)

      return getChildrenArray(children)
    }

    case REACT_CONSUMER_TYPE: {
      const consumerElement = ((element: any): ConsumerElement)
      const { children } = consumerElement.props

      // Read from context and call children, if it's been passed
      if (typeof children === 'function') {
        const type = (consumerElement.type: any)
        const context = typeof type._context === 'object' ? type._context : type
        const value = readContextValue(context)
        return getChildrenArray(children(value))
      } else {
        return []
      }
    }

    case REACT_LAZY_TYPE: {
      const lazyElement = ((element: any): LazyElement)
      const type = lazyElement.type
      const child = mountLazyComponent(type, lazyElement.props, queue)
      return getChildrenArray(child)
    }

    case REACT_MEMO_TYPE: {
      const memoElement = ((element: any): MemoElement)
      const { type } = memoElement.type
      const child = createElement((type: any), memoElement.props)
      return getChildrenArray(child)
    }

    case REACT_FORWARD_REF_TYPE: {
      const refElement = ((element: any): ForwardRefElement)
      const { render: type, defaultProps } = refElement.type
      const props = computeProps(refElement.props, defaultProps)
      const child = createElement((type: any), props)
      return getChildrenArray(child)
    }

    case REACT_ELEMENT_TYPE: {
      const el = ((element: any): UserElement | DOMElement)
      if (typeof el.type === 'string') {
        // String elements can be skipped, so we just return children
        return getChildrenArray(el.props.children)
      } else {
        const userElement = ((element: any):
          | UserElement
          | ClientReferenceElement)
        const { type, props } = userElement
        const child = render(
          type,
          props,
          queue,
          visitor,
          clientRefVisitor,
          userElement
        )
        return getChildrenArray(child)
      }
    }

    case REACT_PORTAL_TYPE:
    // Portals are unsupported during SSR since they're DOM-only
    default:
      return []
  }
}

const visitLoop = (
  traversalChildren: AbstractElement[][],
  traversalMap: Array<void | ContextMap>,
  traversalStore: Array<void | ContextEntry>,
  traversalErrorFrame: Array<null | ClassFrame>,
  queue: Frame[],
  visitor: Visitor,
  clientRefVisitor: ClientReferenceVisitor
): boolean => {
  const prevDispatcher = getReactCurrentDispatcher()
  const start = Date.now()

  try {
    injectReactCurrentDispatcher(Dispatcher)
    while (traversalChildren.length > 0) {
      const element = traversalChildren[traversalChildren.length - 1].shift()
      if (element !== undefined) {
        const children = visitElement(element, queue, visitor, clientRefVisitor)
        traversalChildren.push(children)
        traversalMap.push(flushPrevContextMap())
        traversalStore.push(flushPrevContextStore())
        traversalErrorFrame.push(getCurrentErrorFrame())
      } else {
        traversalChildren.pop()
        restoreContextMap(traversalMap.pop())
        restoreContextStore(traversalStore.pop())
        setCurrentErrorFrame(traversalErrorFrame.pop())
      }

      if (SHOULD_YIELD && Date.now() - start > YIELD_AFTER_MS) {
        return true
      }
    }

    return false
  } catch (error) {
    const errorFrame = getCurrentErrorFrame()
    if (!errorFrame) throw error
    errorFrame.error = error
    queue.unshift(errorFrame)
    return false
  } finally {
    injectReactCurrentDispatcher(prevDispatcher)
  }
}

const makeYieldFrame = (
  traversalChildren: AbstractElement[][],
  traversalMap: Array<void | ContextMap>,
  traversalStore: Array<void | ContextEntry>,
  traversalErrorFrame: Array<null | ClassFrame>
): Frame => ({
  contextMap: getCurrentContextMap(),
  contextStore: getCurrentContextStore(),
  errorFrame: getCurrentErrorFrame(),
  thenable: null,
  kind: 'frame.yield',
  traversalChildren,
  traversalMap,
  traversalStore,
  traversalErrorFrame
})

export const visit = (
  init: AbstractElement[],
  queue: Frame[],
  visitor: Visitor,
  clientRefVisitor: ClientReferenceVisitor
) => {
  const traversalChildren: AbstractElement[][] = [init]
  const traversalMap: Array<void | ContextMap> = [flushPrevContextMap()]
  const traversalStore: Array<void | ContextEntry> = [flushPrevContextStore()]
  const traversalErrorFrame: Array<null | ClassFrame> = [getCurrentErrorFrame()]

  const hasYielded = visitLoop(
    traversalChildren,
    traversalMap,
    traversalStore,
    traversalErrorFrame,
    queue,
    visitor,
    clientRefVisitor
  )

  if (hasYielded) {
    queue.unshift(
      makeYieldFrame(
        traversalChildren,
        traversalMap,
        traversalStore,
        traversalErrorFrame
      )
    )
  }
}

export const update = (
  frame: Frame,
  queue: Frame[],
  visitor: Visitor,
  clientRefVisitor: ClientReferenceVisitor
) => {
  if (frame.kind === 'frame.yield') {
    setCurrentIdentity(null)
    setCurrentContextMap(frame.contextMap)
    setCurrentContextStore(frame.contextStore)
    setCurrentErrorFrame(frame.errorFrame)

    const hasYielded = visitLoop(
      frame.traversalChildren,
      frame.traversalMap,
      frame.traversalStore,
      frame.traversalErrorFrame,
      queue,
      visitor,
      clientRefVisitor
    )

    if (hasYielded) {
      queue.unshift(
        makeYieldFrame(
          frame.traversalChildren,
          frame.traversalMap,
          frame.traversalStore,
          frame.traversalErrorFrame
        )
      )
    }
  } else {
    const prevDispatcher = getReactCurrentDispatcher()
    let children = null

    injectReactCurrentDispatcher(Dispatcher)

    try {
      if (frame.kind === 'frame.class') {
        children = updateClassComponent(queue, frame)
      } else if (frame.kind === 'frame.hooks') {
        children = updateFunctionComponent(queue, frame)
      } else if (frame.kind === 'frame.lazy') {
        children = updateLazyComponent(queue, frame)
      } else if (frame.kind === 'client-ref') {
        children = updateClientReference(queue, frame)
      }
    } catch (error) {
      const errorFrame = getCurrentErrorFrame()
      if (!errorFrame) throw error
      errorFrame.error = error
      queue.unshift(errorFrame)
      children = null
    } finally {
      injectReactCurrentDispatcher(prevDispatcher)
    }

    visit(getChildrenArray(children), queue, visitor, clientRefVisitor)
  }
}
