// app/components/VideoComponent.jsx
"use client";

import React, { useRef, useEffect } from "react";
import { useVideoStore } from "../../../store/useVideoStore";

const VideoComponent = ({ video }) => {
    const videoRef = useRef(null);

    const videoState = useVideoStore((state) => state.videos[video.id]);
    const setVideoState = useVideoStore((state) => state.setVideoState);

    const handlePlayToggle = () => {
        setVideoState(video.id, { play: !videoState.play });
    };

    const handleQueueUpdate = (newQueue) => {
        setVideoState(video.id, { queue: newQueue });
    };

    useEffect(() => {
        if (videoRef.current) {
            if (videoState.play) {
                videoRef.current.play().catch((error) => {
                    console.error("Error attempting to play the video:", error);
                });
            } else {
                videoRef.current.pause();
            }
        }
    }, [videoState.play]);

    return (
        <div style={{ width: "50%", height: "100vh" }}>
            <div>
                <button onClick={handlePlayToggle}>
                    {videoState.play ? "Pause" : "Play"}
                </button>
                <button
                    onClick={() =>
                        handleQueueUpdate({
                            /* new queue data */
                        })
                    }
                >
                    Update Queue
                </button>
            </div>
            <video
                ref={videoRef}
                style={{ width: "100%", height: "100%" }}
                src={video.source}
                controls
                muted
            />
        </div>
    );
};

export default VideoComponent;
