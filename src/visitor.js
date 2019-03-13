// @flow

import type { Node, ComponentType } from 'react'
import { getChildrenArray } from './children'

import {
  typeOf,
  shouldConstruct,
  type DefaultProps,
  type ComponentStatics,
  type AbstractElement,
  type ConsumerElement,
  type ProviderElement,
  type FragmentElement,
  type SuspenseElement,
  type ForwardRefElement,
  type MemoElement,
  type UserElement
} from './element'

import {
  maskContext,
  setCurrentContextMap,
  readContextMap,
  forkContextMap,
  type ContextMap
} from './state'

import {
  mountFunctionComponent,
  mountClassComponent,
  type Frame
} from './render'

import {
  REACT_ELEMENT_TYPE,
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
  REACT_LAZY_TYPE
} from './symbols'

const render = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[]
) => {
  return shouldConstruct(type)
    ? mountClassComponent(type, props, queue)
    : mountFunctionComponent(type, props, queue)
}

export const visitElement = (
  element: AbstractElement,
  queue: Frame[]
): AbstractElement[] => {
  switch (typeOf(element)) {
    case REACT_STRICT_MODE_TYPE:
    case REACT_CONCURRENT_MODE_TYPE:
    case REACT_PROFILER_TYPE:
    case REACT_FRAGMENT_TYPE: {
      // These element types are simply traversed over but otherwise ignored
      const fragmentElement = ((element: any): FragmentElement)
      return getChildrenArray(fragmentElement.props.children)
    }

    case REACT_PORTAL_TYPE: {
      // These element types are unsupported and will not be traversed
      return []
    }

    case REACT_LAZY_TYPE: {
      // TODO: Execute promise and await it
      return []
    }

    case REACT_SUSPENSE_TYPE: {
      // TODO: Store fallback and watch for thrown promise
      const suspenseElement = ((element: any): SuspenseElement)
      return getChildrenArray(suspenseElement.props.children)
    }

    case REACT_PROVIDER_TYPE: {
      const providerElement = ((element: any): ProviderElement)
      const newContextMap = forkContextMap()
      const { value, children } = providerElement.props
      newContextMap.set(providerElement.type._context, value)
      return getChildrenArray(children)
    }

    case REACT_CONTEXT_TYPE: {
      const consumerElement = ((element: any): ConsumerElement)
      const { children } = consumerElement.props

      if (typeof children === 'function') {
        const value = readContextMap(consumerElement.type)
        return getChildrenArray(children(value))
      } else {
        return []
      }
    }

    case REACT_FORWARD_REF_TYPE: {
      const refElement = ((element: any): ForwardRefElement)
      const type = refElement.type.render
      const child = mountFunctionComponent(type, refElement.props, queue)
      return getChildrenArray(child)
    }

    case REACT_MEMO_TYPE: {
      const memoElement = ((element: any): MemoElement)
      const type = memoElement.type.type
      return getChildrenArray(render(type, memoElement.props, queue))
    }

    case REACT_ELEMENT_TYPE: {
      const userElement = ((element: any): UserElement)
      const type = userElement.type
      return getChildrenArray(render(type, userElement.props, queue))
    }

    default:
      return []
  }
}