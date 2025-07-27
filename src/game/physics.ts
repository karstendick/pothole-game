import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin'

let havokInstance: unknown = null

declare global {
  const HavokPhysics: () => Promise<unknown>
}

export async function initializePhysics(): Promise<HavokPlugin> {
  if (!havokInstance) {
    // Use the global HavokPhysics from CDN
    // eslint-disable-next-line no-undef
    havokInstance = await HavokPhysics()
  }
  return new HavokPlugin(true, havokInstance)
}
