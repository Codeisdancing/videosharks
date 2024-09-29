// store/useRouterStore.js
import { create } from 'zustand'

const useRouterStore = create((set, get) => ({
  activeTab: 1, // Default active tab id ('Sharks' with id: 1)
  setActiveTab: tabId => set({ activeTab: tabId }), // Action to update activeTab

  getActiveTab: () => get().activeTab, // Getter to access activeTab

  isLoading: false, // Default loading state
  setIsLoading: value => set({ isLoading: value }), // Action to update loading state

  settings: false, // Default loading state
  getSettings: () => get().settings,
  setSettings: toggle => set({ settings: toggle }),

  currentShark: 1, // Add this line to track the current slide index

  getCurrentShark: () => get().currentShark, // Getter to access currentSlide

  setCurrentShark: index => set({ currentShark: index }), // Update this line

  tabList: [
    {
      id: 2,
      title: 'Friends',
      heading: 'Friends',
    },
    {
      id: 3,
      title: 'Tasks',
      heading: 'Tasks',
    },
    {
      id: 1,
      title: 'Sharks',
      heading: '',
    },
    {
      id: 4,
      title: 'Top',
      heading: 'League',
    },
    {
      id: 5,
      title: 'Airdrop',
      heading: 'Airdrop',
    },
  ], // List of tabs with numerical IDs
}))

export default useRouterStore
