// @flow

import type { ComponentType } from 'react'
import type { Identity } from '../internals'
import type { ContextMap, ContextStore, ContextEntry, Hook } from './state'
import type {
  AbstractElement,
  DefaultProps,
  ComponentStatics,
  LazyComponent,
  ClientReference,
  ClientReferenceElement
} from './element'
import type { ClientReferenceVisitor } from './input'

export type BaseFrame = {
  contextMap: ContextMap,
  contextStore: ContextStore,
  errorFrame: ClassFrame | null,
  thenable: Promise<any> | null
}

/** Description of suspended React.lazy components */
export type LazyFrame = BaseFrame & {
  kind: 'frame.lazy',
  type: LazyComponent,
  props: Object
}

/** Description of suspended React.Components */
export type ClassFrame = BaseFrame & {
  kind: 'frame.class',
  type: ComponentType<DefaultProps> & ComponentStatics,
  error: Error | null,
  instance: any
}

/** Description of suspended function components with hooks state */
export type HooksFrame = BaseFrame & {
  kind: 'frame.hooks',
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: Object,
  id: Identity,
  hook: Hook | null
}

/** Description of a pause to yield to the event loop */
export type YieldFrame = BaseFrame & {
  kind: 'frame.yield',
  traversalChildren: AbstractElement[][],
  traversalMap: Array<void | ContextMap>,
  traversalStore: Array<void | ContextEntry>,
  traversalErrorFrame: Array<null | ClassFrame>
}

/** Description of client reference element */
export type ClientRefFrame = BaseFrame & {
  kind: 'client-ref',
  type: ClientReference,
  props: Object,
  id: Identity,
  hook: Hook | null,
  element: ClientReferenceElement,
  clientRefVisitor: ClientReferenceVisitor
}

export type Frame =
  | ClassFrame
  | HooksFrame
  | LazyFrame
  | YieldFrame
  | ClientRefFrame

export type RendererState = {|
  uniqueID: number
|}
