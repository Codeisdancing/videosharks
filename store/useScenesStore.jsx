// src/store/useScenesStore.js

import { create } from 'zustand'

const useScenesStore = create(set => ({
  scenes: {},

  addScene: (id, sceneData) =>
    set(state => ({
      scenes: {
        ...state.scenes,
        [id]: sceneData,
      },
    })),

  removeScene: id =>
    set(state => {
      const newScenes = { ...state.scenes }
      delete newScenes[id]
      return { scenes: newScenes }
    }),

  playClip: (id, clip) =>
    set(state => ({
      scenes: {
        ...state.scenes,
        [id]: {
          ...state.scenes[id],
          currentClip: { ...clip, _timestamp: Date.now() }, // Добавлено _timestamp
          isPlaying: true,
        },
      },
    })),

  enqueueClip: (id, clipName) =>
    set(state => ({
      scenes: {
        ...state.scenes,
        [id]: {
          ...state.scenes[id],
          clipQueue: [...state.scenes[id].clipQueue, clipName],
        },
      },
    })),

  dequeueClip: (id, clipName) =>
    set(state => ({
      scenes: {
        ...state.scenes,
        [id]: {
          ...state.scenes[id],
          clipQueue: state.scenes[id].clipQueue.filter(name => name !== clipName),
        },
      },
    })),

  updateScene: (id, updatedProperties) =>
    set(state => ({
      scenes: {
        ...state.scenes,
        [id]: {
          ...state.scenes[id],
          ...updatedProperties,
        },
      },
    })),
}))

export default useScenesStore
