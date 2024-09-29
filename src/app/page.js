"use client";

import React, { useState, useEffect, useRef } from "react";
import VideoComponent from "@/components/video/VideoComponent";
import { useVideoStore } from "../../store/useVideoStore";
import { videoSources } from "../../data/videoSources";

export default function Home() {
    const getVideoSourceById = (id) => {
        return videoSources.find((video) => video.id === id);
    };

    const initializeVideos = useVideoStore((state) => state.initializeVideos);
    const videos = useVideoStore((state) => state.videos);

    useEffect(() => {
        initializeVideos(videoSources);
    }, [initializeVideos]);

    return (
        <div>
            {Object.values(videos).map((video) => (
                <VideoComponent key={video.id} video={video} />
            ))}
        </div>
    );
}
