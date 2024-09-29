// store/useRouterStore.js
import { create } from 'zustand'

const useUserStore = create((set, get) => ({
  batteryLevel: 6,
  getBatteryLevel: () => get().batteryLevel,
  setBatteryLevel: level => set({ batteryLevel: level }),

  maxBatteryLevel: 9,
  getMaxBatteryLevel: () => get().maxBatteryLevel,
  setMaxBatteryLevel: level => set({ batteryLevel: level }),

  currentSharkIsLocked: false,
  getCurrentSharkIsLocked: () => get().currentSharkIsLocked,
  setCurrentSharkIsLocked: status => set({ currentSharkIsLocked: status }),

  currentSharkPrice: 3500,
  getCurrentSharkPrice: () => get().currentSharkPrice,
  setCurrentSharkIsPrice: amount => set({ currentSharkIsPrice: amount }),

  batteryLevelUpPrice: 90,
  getBatteryLevelUpPrice: () => get().batteryLevelUpPrice,
  setbatteryLevelUpPrice: amount => set({ batteryLevelUpPrice: amount }),
}))

export default useUserStore
