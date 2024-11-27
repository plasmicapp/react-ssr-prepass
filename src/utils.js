// @flow

import { shouldConstruct } from './element'
import { CLIENT_REFERENCE_TAG } from './symbols'
import React, { type ComponentType } from 'react'
import type { DefaultProps, ComponentStatics } from './types'

export function isClientReference(reference: Object): boolean {
  return reference.$$typeof === CLIENT_REFERENCE_TAG
}

export const getComponentName = (
  type: ComponentType<DefaultProps> & ComponentStatics
): any => {
  if (isClientReference(type)) {
    return undefined
  }
  if (type.displayName) {
    return type.displayName
  }
  if (shouldConstruct(type)) {
    return type.constructor.name
  } else {
    return type.name
  }
}

export function isReact19() {
  return !(React: any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
}
