// @flow

import type { UserElement, ClientReferenceElement } from './element'
import type { Node, Context } from 'react'

/** When encountering a class component this function can trigger an suspense */
export type Visitor = (
  element: UserElement,
  instance?: any
) => void | Promise<any>

export type ClientReferenceVisitor = (
  element: ClientReferenceElement
) => void | Node
