import { create } from "zustand";

export const useVideoStore = create((set) => ({
    videos: {}, // Holds state for each video keyed by id

    // Initialize videos with default states
    initializeVideos: (videoSources) =>
        set(() => {
            const videos = videoSources.reduce((acc, video) => {
                acc[video.id] = {
                    play: false,
                    queue: {},
                    ...video, // Include other video properties if needed
                };
                return acc;
            }, {});
            return { videos };
        }),

    // Update the state of a specific video by id
    setVideoState: (id, newState) =>
        set((state) => ({
            videos: {
                ...state.videos,
                [id]: {
                    ...state.videos[id],
                    ...newState,
                },
            },
        })),
}));
