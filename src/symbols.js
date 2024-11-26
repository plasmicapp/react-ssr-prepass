// @flow

import type { Node } from 'react'

/**
 * Element is already legacy in NextJS v15 https://github.com/vercel/next.js/pull/65058
 * https://github.com/facebook/react/pull/28813
 */
let Element = 0xeac7
let TransitionalElement = 0xeac7
let Portal = 0xeaca
let Fragment = 0xeacb
let StrictMode = 0xeacc
let Profiler = 0xead2
let ContextProvider = 0xeacd
let ContextConsumer = undefined
let Context = 0xeace
let ConcurrentMode = 0xeacf
let ForwardRef = 0xead0
let Suspense = 0xead1
let Memo = 0xead3
let Lazy = 0xead4
let ClientReferenceTag = undefined

if (typeof Symbol === 'function' && Symbol.for) {
  const symbolFor = Symbol.for
  Element = symbolFor('react.element')
  TransitionalElement = symbolFor('react.transitional.element')
  Portal = symbolFor('react.portal')
  Fragment = symbolFor('react.fragment')
  StrictMode = symbolFor('react.strict_mode')
  Profiler = symbolFor('react.profiler')
  ContextProvider = symbolFor('react.provider')
  ContextConsumer = symbolFor('react.consumer')
  Context = symbolFor('react.context')
  ConcurrentMode = symbolFor('react.concurrent_mode')
  ForwardRef = symbolFor('react.forward_ref')
  Suspense = symbolFor('react.suspense')
  Memo = symbolFor('react.memo')
  Lazy = symbolFor('react.lazy')
  ClientReferenceTag = symbolFor('react.client.reference')
}

/** Literal types representing the ReactSymbol values. These values do not actually match the values from react-is! */
export type ReactSymbol =
  | 'react.element' /* 0xeac7 | Symbol(react.element) */
  | 'react.transitional.element' /* 0xeac7 | Symbol(react.transitional.element) */
  | 'react.portal' /* 0xeaca | Symbol(react.portal) */
  | 'react.fragment' /* 0xeacb | Symbol(react.fragment) */
  | 'react.strict_mode' /* 0xeacc | Symbol(react.strict_mode) */
  | 'react.profiler' /* 0xead2 | Symbol(react.profiler) */
  | 'react.provider' /* 0xeacd | Symbol(react.provider) */
  | 'react.consumer' /* undefined | Symbol(react.consumer) */
  | 'react.context' /* 0xeace | Symbol(react.context) */
  | 'react.concurrent_mode' /* 0xeacf | Symbol(react.concurrent_mode) */
  | 'react.forward_ref' /* 0xead0 | Symbol(react.forward_ref) */
  | 'react.suspense' /* 0xead1 | Symbol(react.suspense) */
  | 'react.memo' /* 0xead3 | Symbol(react.memo) */
  | 'react.lazy' /* 0xead4 | Symbol(react.lazy) */

export const REACT_ELEMENT_TYPE: 'react.element' = (Element: any)
export const REACT_TRANSITIONAL_ELEMENT_TYPE: 'react.transitional.element' =
  (TransitionalElement: any)
export const REACT_PORTAL_TYPE: 'react.portal' = (Portal: any)
export const REACT_FRAGMENT_TYPE: 'react.fragment' = (Fragment: any)
export const REACT_STRICT_MODE_TYPE: 'react.strict_mode' = (StrictMode: any)
export const REACT_PROFILER_TYPE: 'react.profiler' = (Profiler: any)
export const REACT_PROVIDER_TYPE: 'react.provider' = (ContextProvider: any)
export const REACT_CONSUMER_TYPE: 'react.consumer' = (ContextConsumer: any)
export const REACT_CONTEXT_TYPE: 'react.context' = (Context: any)
export const REACT_CONCURRENT_MODE_TYPE: 'react.concurrent_mode' =
  (ConcurrentMode: any)
export const REACT_FORWARD_REF_TYPE: 'react.forward_ref' = (ForwardRef: any)
export const REACT_SUSPENSE_TYPE: 'react.suspense' = (Suspense: any)
export const REACT_MEMO_TYPE: 'react.memo' = (Memo: any)
export const REACT_LAZY_TYPE: 'react.lazy' = (Lazy: any)
export const CLIENT_REFERENCE_TAG: 'react.client.reference' =
  (ClientReferenceTag: any)
