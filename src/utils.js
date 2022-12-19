import { shouldConstruct } from './element'

export const getComponentName = (
  type: ComponentType<DefaultProps> & ComponentStatics
) => {
  if (type.displayName) {
    return type.displayName
  }
  if (shouldConstruct(type)) {
    return type.constructor.name
  } else {
    return type.name
  }
}
