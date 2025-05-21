import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import Cookies from "js-cookie";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Sidebar from "./Partials/InstructorSidebar";
import Header from "./Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import {
  Button,
  Card,
  Col,
  Row,
  Form,
  Spinner,
  Badge,
  Modal,
} from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaPencilAlt, FaPlus, FaEdit, FaTimes, FaTrash } from "react-icons/fa";
import { TbGripVertical } from "react-icons/tb";

const normalizeVideoUrl = (url) => {
  if (!url) return url;
  let fixed = url;
  //  console.log(`Normalized video URL: ${url} → ${fixed}`);
  return fixed;
};

let youtubeStylesAdded = false;
const applyYouTubeStyle = (player) => {
  if (!player || player.isDisposed()) {
    //    console.warn("applyYouTubeStyle called on null or disposed player.");
    return;
  }
  //  console.log("Applying YouTube style to player.");
  player.addClass("vjs-youtube-style");
  const generateRandomColor = () => {
    const colors = ["#8c0101", "#034287"];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  const progressColor = generateRandomColor();
  if (!youtubeStylesAdded) {
    const styleId = "vjs-youtube-global-styles";
    if (!document.getElementById(styleId)) {
      const globalStyle = document.createElement("style");
      globalStyle.id = styleId;
      globalStyle.textContent = `
        .video-js.vjs-youtube-style {
          font-family: 'Roboto', Arial, sans-serif;
        }
        body.dark-mode button:not(.btn-primary):not(.btn-success):not(.btn-danger) {
        background-color: rgba(255, 255, 255, 0) !important;
        border-color: rgba(255, 255, 255, 0) !important;
    }
        .video-js.vjs-youtube-style .vjs-control-bar {
          background: transparent; /* Changed from gradient to transparent */
          height: 40px;
          padding: 0;
          margin: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        
        .video-js.vjs-youtube-style:hover .vjs-control-bar {
          opacity: 1;
          background: rgba(0, 0, 0, 0);
        }
        
        .video-js.vjs-youtube-style .vjs-progress-control {
          position: absolute !important;
          top: -10px !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          height: 3px;
          transition: height 0.1s;
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box;
          backgroundcolor: rgba(0, 0, 0, 0)!important;
        }
        
        .video-js.vjs-youtube-style:hover .vjs-progress-control {
          height: 5px;
        }
        
        .video-js.vjs-youtube-style .vjs-play-progress {
          background-color: ${progressColor};
        }
        
        .video-js.vjs-youtube-style .vjs-progress-holder {
          height: 3px;
          margin: 0;
          width: 100%;
          max-width: 100%;
        }
        
        .video-js.vjs-youtube-style .vjs-load-progress,
        .video-js.vjs-youtube-style .vjs-load-progress div {
          backgroundcolor: rgba(0, 0, 0, 0);
        }
        
        .video-js.vjs-youtube-style .vjs-progress-control .vjs-progress-holder {
          margin: 0;
          padding: 0;
          width: 100%;
        }
        
        .video-js.vjs-youtube-style .vjs-progress-control,
        .video-js.vjs-youtube-style .vjs-progress-holder,
        .video-js.vjs-youtube-style .vjs-slider,
        .video-js.vjs-youtube-style .vjs-slider-horizontal {
          margin: 0;
          padding: 0;
          backgroundcolor: rgba(0, 0, 0, 0);
        }
        
        .video-js.vjs-youtube-style .vjs-button > .vjs-icon-placeholder:before {
          font-size: 20px;
          line-height: 40px;
        }
        
        .vjs-youtube-left-controls,
        .vjs-youtube-right-controls {
          display: flex;
          align-items: center;
          padding: 0 5px;
          backgroundcolor: rgba(0, 0, 0, 0)!important;
        }
        
        .video-js.vjs-youtube-style .vjs-control {
          width: 30px;
          backgroundcolor: rgba(0, 0, 0, 0)!important;
        }
        
        /* Compact Time Display in YouTube style */
        .video-js.vjs-youtube-style .vjs-current-time,
        .video-js.vjs-youtube-style .vjs-time-divider,
        .video-js.vjs-youtube-style .vjs-duration {
          padding: 0;
          margin: 0;
          font-size: 12px;
          display: block !important;
          line-height: 40px;
          width: auto;
          backgroundcolor: rgba(0, 0, 0, 0)!important;
        }
        
        /* Make current time and duration display tight together */
        .video-js.vjs-youtube-style .vjs-current-time-display,
        .video-js.vjs-youtube-style .vjs-duration-display {
          padding: 0 1px;
        }
        
        /* Adjust time divider */
        .video-js.vjs-youtube-style .vjs-time-divider {
          padding: 0;
          min-width: 8px;
          text-align: center;
        }
        
        /* Hide the time remaining display */
        .video-js.vjs-youtube-style .vjs-remaining-time {
          display: none !important;
        }
        
        .video-js.vjs-youtube-style .vjs-volume-panel {
          display: flex;
          margin-right: 0;
          backgroundcolor: rgba(0, 0, 0, 0)!important;
        }
        
        .video-js.vjs-youtube-style .vjs-volume-control {
          width: 0;
          transition: width 0.2s;
          height: 100%;
          backgroundcolor: rgba(0, 0, 0, 0)!important;
        }
        
        .video-js.vjs-youtube-style .vjs-volume-panel:hover .vjs-volume-control,
        .video-js.vjs-youtube-style .vjs-volume-panel:focus .vjs-volume-control,
        .video-js.vjs-youtube-style .vjs-volume-panel.vjs-hover .vjs-volume-control {
          visibility: visible;
          opacity: 1;
          width: 50px;
          height: 100%;
          backgroundcolor: rgba(0, 0, 0, 0)!important;
        }
        
        /* Settings button (Speedometer icon) */
        .vjs-youtube-settings-button .vjs-icon-placeholder:before {
          content: "⚙";
          font-size: 18px;
        }
        
        /* Group right-aligned controls tighter */
        .vjs-youtube-right-controls {
          display: flex;
          align-items: center;
          gap: 0;
        }
        
        .vjs-speed-menu {
          position: absolute;
          bottom: 50px;
          right: 10px;
          background-color: rgba(28, 28, 28, 0.9);
          border-radius: 2px;
          padding: 8px 0;
          width: 200px;
          display: none;
          z-index: 100;
        }
        
        .vjs-speed-menu.active {
          display: block;
        }
        
        .vjs-speed-menu-item {
          padding: 8px 20px;
          color: white;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
        }
        
        .vjs-speed-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .vjs-speed-menu-item.selected {
          font-weight: bold;
        }
        
        .vjs-speed-menu-item.selected:after {
          content: "✓";
        }
        
        .video-js.vjs-youtube-style .vjs-volume-level {
          background-color: white;
        }

        /* Volume panel - with centered control */
        .video-js.vjs-youtube-style .vjs-volume-panel {
          display: flex;
          align-items: center;
          margin-right: 0;
        }

        /* Volume control - centered position */
        .video-js.vjs-youtube-style .vjs-volume-control {
          width: 0;
          transition: width 0.2s;
          height: 100%;
          display: flex;
          align-items: center;
        }

        /* Volume bar container */
        .video-js.vjs-youtube-style .vjs-volume-bar {
          margin: 0 auto;
          height: 3px;
        }

        /* When hovering the volume panel */
        .video-js.vjs-youtube-style .vjs-volume-panel:hover .vjs-volume-control,
        .video-js.vjs-youtube-style .vjs-volume-panel:focus .vjs-volume-control,
        .video-js.vjs-youtube-style .vjs-volume-panel.vjs-hover .vjs-volume-control {
          visibility: visible;
          opacity: 1;
          width: 50px;
          height: 100%;
        }

        /* Volume level indicator */
        .video-js.vjs-youtube-style .vjs-volume-level {
          background-color: white;
          height: 100%;
        }

        /* Volume panel - with centered control */
        .video-js.vjs-youtube-style .vjs-volume-panel {
          display: flex;
          align-items: center;
          margin-right: 0;
        }

        /* Volume control - adjust vertical position */
        .video-js.vjs-youtube-style .vjs-volume-control {
          width: 0;
          transition: width 0.2s;
          height: 100%;
          display: flex;
          align-items: center;
          margin-top:0.7px; 
        }

        /* Volume bar container - adjust position */
        .video-js.vjs-youtube-style .vjs-volume-bar {
          margin: 0 auto;
          height: 3px;
          position: relative;
          top: 0.5px; /* Move the bar down for better alignment */
        }

        /* When hovering the volume panel */
        .video-js.vjs-youtube-style .vjs-volume-panel:hover .vjs-volume-control,
        .video-js.vjs-youtube-style .vjs-volume-panel:focus .vjs-volume-control,
        .video-js.vjs-youtube-style .vjs-volume-panel.vjs-hover .vjs-volume-control {
          visibility: visible;
          opacity: 1;
          width: 50px;
          height: 100%;
        }
      `;
      document.head.appendChild(globalStyle);
      youtubeStylesAdded = true;
      //      console.log("Added global YouTube styles.");
    }
  }

  player.ready(() => {
    setTimeout(() => {
      const progressControl = player
        .el()
        .querySelector(".vjs-progress-control");
      if (progressControl) {
        progressControl.style.width = "100%";

        const progressHolder = player
          .el()
          .querySelector(".vjs-progress-holder");
        if (progressHolder) {
          progressHolder.style.width = "100%";
        }
      }
    }, 100);

    const settingsButton = document.createElement("button");
    settingsButton.className =
      "vjs-control vjs-button vjs-youtube-settings-button";
    settingsButton.type = "button";
    settingsButton.title = "Settings";

    const iconPlaceholder = document.createElement("span");
    iconPlaceholder.className = "vjs-icon-placeholder";
    settingsButton.appendChild(iconPlaceholder);

    const speedMenu = document.createElement("div");
    speedMenu.className = "vjs-speed-menu";

    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    speeds.forEach((speed) => {
      const menuItem = document.createElement("div");
      menuItem.className = "vjs-speed-menu-item";
      menuItem.textContent = speed === 1 ? "Normal" : `${speed}×`;
      menuItem.dataset.speed = speed;

      if (player.playbackRate() === speed) {
        menuItem.classList.add("selected");
      }

      menuItem.addEventListener("click", () => {
        player.playbackRate(speed);

        document.querySelectorAll(".vjs-speed-menu-item").forEach((item) => {
          item.classList.remove("selected");
        });
        menuItem.classList.add("selected");

        speedMenu.classList.remove("active");
      });

      speedMenu.appendChild(menuItem);
    });

    settingsButton.addEventListener("click", (e) => {
      e.stopPropagation();
      speedMenu.classList.toggle("active");
    });

    const closeMenuHandler = (e) => {
      if (!speedMenu.contains(e.target) && !settingsButton.contains(e.target)) {
        speedMenu.classList.remove("active");
      }
    };

    document.addEventListener("click", closeMenuHandler);
    player.closeMenuHandler_ = closeMenuHandler;
    const controlBar = player.getChild("controlBar").el();
    const leftControls = document.createElement("div");
    leftControls.className = "vjs-youtube-left-controls";
    const rightControls = document.createElement("div");
    rightControls.className = "vjs-youtube-right-controls";
    const playToggle = controlBar.querySelector(".vjs-play-control");
    const volumePanel = controlBar.querySelector(".vjs-volume-panel");
    const currentTime = controlBar.querySelector(".vjs-current-time");
    const timeDivider = controlBar.querySelector(".vjs-time-divider");
    const durationDisplay = controlBar.querySelector(".vjs-duration");
    const progressControl = controlBar.querySelector(".vjs-progress-control");
    const fullscreenToggle = controlBar.querySelector(
      ".vjs-fullscreen-control"
    );
    const pictureInPicture = controlBar.querySelector(
      ".vjs-picture-in-picture-control"
    );

    Array.from(controlBar.children).forEach((child) => {
      if (
        child !== progressControl &&
        !leftControls.contains(child) &&
        !rightControls.contains(child)
      ) {
        controlBar.removeChild(child);
      }
    });

    if (playToggle) leftControls.appendChild(playToggle);
    if (volumePanel) leftControls.appendChild(volumePanel);
    if (currentTime) leftControls.appendChild(currentTime);
    if (timeDivider) leftControls.appendChild(timeDivider);
    if (durationDisplay) leftControls.appendChild(durationDisplay);

    rightControls.appendChild(settingsButton);
    if (pictureInPicture) rightControls.appendChild(pictureInPicture);
    if (fullscreenToggle) rightControls.appendChild(fullscreenToggle);

    controlBar.appendChild(leftControls);
    controlBar.appendChild(rightControls);

    player.el().appendChild(speedMenu);
  });
};

function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showLecturePopup, setShowLecturePopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [selectedCourseCategory, setSelectedCourseCategory] = useState("all");
  const [showPopup, setShowPopup] = useState(false);
  const [popupCategory, setPopupCategory] = useState(null);
  const [showAddMorePopup, setShowAddMorePopup] = useState(false);
  const [unboughtCourses, setUnboughtCourses] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [showCheckoutPopup, setShowCheckoutPopup] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [allCourses, setAllCourses] = useState([]);
  const [boughtCourses, setBoughtCourses] = useState([]);
  const [cartId, setCartId] = useState(localStorage.getItem("cart_id") || null);
  const [activeTab, setActiveTab] = useState("description");
  const [lectureResources, setLectureResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [courseProgress, setCourseProgress] = useState({});
  const [lectureProgress, setLectureProgress] = useState({});
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditLectureModal, setShowEditLectureModal] = useState(false);
  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [showEditResourceModal, setShowEditResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const[addingCategory, setAddingCategory] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    price: "",
    level: "",
    category: "",
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const progressUpdateTimeoutRef = useRef(null);
  const videoContainerRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const fetchData = async () => {
    try {
      setFetching(true);
      const response = await useAxios().get(`teacher/courses/`);
      setCourses(response.data);
      setFetching(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        navigate("/");
      }
    }
  };

  const fetchLectures = async (courseId) => {
    try {
      const response = await useAxios().get(
        `/teacher/course/${courseId}/lectures/`
      );
      // Sort by order field
      const sorted = [...response.data].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      setLectures(sorted);
    } catch (error) {
      //      console.error("Error fetching lectures:", error);
      setLectures([]);
    }
  };

  const openLecturePopup = async (course) => {
    setSelectedCourse(course);
    await fetchLectures(course.id);
    setShowLecturePopup(true);
    setSelectedLecture(null); // Reset selected lecture
  };

  // When Add Lecture is clicked
  const handleAddLecture = () => {
    setEditingLecture(null);
    setShowEditLectureModal(true);
  };

  const handleLectureDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(lectures);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setLectures(reordered);

    // Send new order to backend
    try {
      await useAxios().post(
        `/teacher/course/${selectedCourse.id}/lecture-order/`,
        {
          lecture_order: reordered.map((l) => l.id),
        }
      );
    } catch (err) {
      Toast().fire({ icon: "error", title: "Failed to save lecture order." });
    }
  };

  const closeLecturePopup = async () => {
    // Save the current lecture order before closing
    if (selectedCourse && lectures.length > 0) {
      try {
        await useAxios().post(
          `/teacher/course/${selectedCourse.id}/lecture-order/`,
          {
            lecture_order: lectures.map((l) => l.id),
          }
        );
      } catch (err) {
        Toast().fire({ icon: "error", title: "Failed to save lecture order." });
      }
    }
    setShowLecturePopup(false);
    setSelectedCourse(null);
    setSelectedLecture(null);

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  };
  const handleShowCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const fetchLectureResources = async (courseId, lectureId) => {
    try {
      setLoadingResources(true);
      const response = await useAxios().get(
        `/course/${courseId}/lecture/${lectureId}/resources/`
      );

      // Log the response to inspect file sizes
      //      console.log("Resources response:", response.data);

      // Make sure resources have proper file size information
      const resourcesWithSize = response.data.map((resource) => {
        // Ensure file_size is a number if available
        if (resource.file_size && !isNaN(parseFloat(resource.file_size))) {
          resource.file_size = parseFloat(resource.file_size);
        }
        return resource;
      });

      setLectureResources(resourcesWithSize);
    } catch (error) {
      //      console.error("Error fetching lecture resources:", error);
      setLectureResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleLectureSelect = async (lecture) => {
    if (!lecture || !selectedCourse) {
      /* ... */ return;
    }
    if (selectedLecture?.id === lecture.id && playerRef.current) {
      /* ... */ return;
    }

    setIsVideoLoading(true);
    setSelectedLecture(lecture);

    try {
      // --- 1. Fetch Data ---
      //      console.log(`Fetching data for lecture ID: ${lecture.id}`);

      // --- Get Axios instance ---
      let axiosInstance;
      try {
        axiosInstance = useAxios(); // Get the configured Axios instance
        if (!axiosInstance) {
          //          console.error("useAxios() returned null or undefined!");
          throw new Error("Axios instance is not available.");
        }
        //        console.log("useAxios() instance obtained:", axiosInstance);
      } catch (axiosError) {
        //        console.error("Error obtaining Axios instance:", axiosError);
        setIsVideoLoading(false);
        // Optionally show a user-facing error message here
        return; // Stop execution if Axios isn't available
      }
      // --- End Get ---

      // Use the obtained axiosInstance for all requests
      const [progressResponse, videoResponse, resources] = await Promise.all([
        axiosInstance.get(`/lecture/${lecture.id}/progress/`).catch((err) => {
          //          console.error("Progress fetch error:", err);
          //          console.error("Progress fetch error response:", err.response);
          return { data: null }; // Ensure Promise.all doesn't reject immediately
        }),
        axiosInstance
          .get(`/lecture/${lecture.id}/video-metadata/`)
          .catch((err) => {
            //            console.error("Metadata fetch error:", err);
            //            console.error("Metadata fetch error response:", err.response);
            return { data: null }; // Ensure Promise.all doesn't reject immediately
          }),
        fetchLectureResources(selectedCourse.id, lecture.id), // Assuming this also uses useAxios internally or is handled
      ]);

      // Log the raw videoResponse object
      //      console.log("Raw videoResponse:", videoResponse);
      // Log the data part of the response
      //      console.log("videoResponse.data:", videoResponse?.data);
      // Log the URL specifically
      //      console.log("videoResponse.data.url:", videoResponse?.data?.url);

      // ... (update progress state based on progressResponse) ...
      if (progressResponse?.data) {
        setVideoCurrentTime(progressResponse.data.current_time || 0);
        setVideoDuration(progressResponse.data.duration || 0);
        setLectureProgress((prev) => ({
          ...prev,
          [lecture.id]: {
            percentage: progressResponse.data.percentage_complete || 0,
            completed: progressResponse.data.completed || false,
            current_time: progressResponse.data.current_time || 0,
          },
        }));
      }

      // --- 2. Dispose Existing Player ---
      const disposePlayer = () => {
        return new Promise((resolve) => {
          if (playerRef.current) {
            //            console.log("Disposing existing player instance.");
            try {
              // Remove specific listener if added (handled in useEffect)
              playerRef.current.dispose(); // Dispose should handle DOM removal
            } catch (e) {
              //              console.error("Error disposing player:", e);
            } finally {
              playerRef.current = null;
              videoRef.current = null; // Clear video element ref too
            }
          }
          resolve(); // Resolve immediately even if no player existed
        });
      };

      await disposePlayer(); // Wait for disposal attempt

      // --- 3. Prepare Container and Initialize New Player (with delay) ---
      // Use setTimeout to allow DOM changes from dispose() to settle
      setTimeout(() => {
        const container = videoContainerRef.current;
        if (!container) {
          //          console.error("Video container ref is not available after delay.");
          setIsVideoLoading(false);
          return;
        }

        // Check if container is empty (optional, dispose should handle it)
        if (container.firstChild) {
          //          console.warn(
          //            "Container was not empty after player disposal. Video.js dispose might not have fully cleaned up."
          //          );
          // Avoid manual clearing here to prevent conflicts
        }

        //        console.log("Creating new video element.");
        const newVideoElement = document.createElement("video");
        // ... (set attributes and styles for newVideoElement) ...
        newVideoElement.className = "video-js vjs-default-skin";
        newVideoElement.setAttribute("controls", "true");
        newVideoElement.setAttribute("preload", "auto");
        newVideoElement.style.width = "100%";
        newVideoElement.style.height = "100%";

        // Append the new element
        container.appendChild(newVideoElement);
        videoRef.current = newVideoElement;

        if (!videoResponse?.data?.url) {
          //          console.error(
          //            "Video URL is missing or invalid in videoResponse.data:",
          //            videoResponse?.data
          //          );

          if (videoRef.current && videoRef.current.parentNode === container) {
            container.removeChild(videoRef.current);
          }
          videoRef.current = null;
          setIsVideoLoading(false);
          return;
        }

        const videoJsOptions = {
          /* ... */
        };

        try {
          //          console.log("Initializing new video.js player.");
          playerRef.current = videojs(videoRef.current, videoJsOptions);

          playerRef.current.ready(() => {
            if (!playerRef.current || playerRef.current.isDisposed()) {
              /* ... */ return;
            }
            //            console.log("Player is ready.");

            let videoSrc = videoResponse.data.url;
            const videoType = videoResponse.data.mime_type || "video/mp4";
            // --- FIX: Construct full URL correctly ---
            if (videoSrc && videoSrc.startsWith("/")) {
              const baseURL =
                axiosInstance.defaults.baseURL || "https://127.0.0.1:8000"; // Use baseURL from the instance
              const cleanBaseURL = baseURL.endsWith("/")
                ? baseURL.slice(0, -1)
                : baseURL;
              const cleanVideoSrcPath = videoSrc.startsWith("/")
                ? videoSrc.slice(1)
                : videoSrc;
              videoSrc = `${cleanBaseURL}/${cleanVideoSrcPath}`;
              //              console.log(`Constructed full video URL: ${videoSrc}`);
            } else if (videoSrc && !videoSrc.startsWith("http")) {
              const baseURL =
                axiosInstance.defaults.baseURL || "https://127.0.0.1:8000"; // Use baseURL from the instance
              const cleanBaseURL = baseURL.endsWith("/")
                ? baseURL.slice(0, -1)
                : baseURL;
              videoSrc = `${cleanBaseURL}/${videoSrc}`;
              //              console.log(
              //                `Constructed full video URL (no leading slash case): ${videoSrc}`
              //              );
            }
            videoSrc = videoSrc.replace(/\\/g, "/");
            //            console.log(`Setting video source: ${videoSrc} (${videoType})`);
            playerRef.current.src({ src: videoSrc, type: videoType });
            playerRef.current.on("timeupdate", handleTimeUpdate);
            playerRef.current.on("loadedmetadata", handleVideoLoaded);
            // ... other listeners ...
            playerRef.current.on("error", () => {
              /* ... error handling ... */ setIsVideoLoading(false);
            });
            playerRef.current.on("loadeddata", () => {
              //              console.log("Video data loaded.");
              setIsVideoLoading(false);
            });
            playerRef.current.on("canplay", () => {
              //              console.log("Video can play.");
            });

            applyYouTubeStyle(playerRef.current);

            // Use progressResponse data for start time
            const startTime = progressResponse?.data?.current_time;
            if (startTime && startTime > 0) {
              //              console.log(`Setting current time to: ${startTime}`);
              playerRef.current.currentTime(startTime);
            }
            if (isVideoLoading) setIsVideoLoading(false);
          });
        } catch (initError) {
          //          console.error("Error initializing video.js player:", initError);
          // Clean up the newly added video element on init error
          if (videoRef.current && videoRef.current.parentNode === container) {
            container.removeChild(videoRef.current);
          }
          videoRef.current = null;
          setIsVideoLoading(false);
        }
      }, 100); // Delay in milliseconds (adjust if needed)
    } catch (error) {
      //      console.error("Error in handleLectureSelect:", error);
      // Toast.fire({ icon: "error", title: "Failed to load lecture video." }); // Ensure Toast is available
      setIsVideoLoading(false);
    }
  };

  const handleEditLecture = (lecture) => {
    setEditingLecture(lecture);
    setShowEditLectureModal(true);
  };

  const handleVideoLoaded = () => {
    try {
      if (!playerRef.current || !selectedLecture) return;

      const duration = playerRef.current.duration();
      if (isNaN(duration) || duration <= 0) return;

      //      console.log(
      //        `Video loaded: ${selectedLecture.title}, duration: ${formatTime(duration)}`
      //      );

      setVideoDuration(duration);

      if (videoCurrentTime > 0 && videoCurrentTime < duration) {
        //        console.log(`Restoring playback position to ${videoCurrentTime}s`);
        playerRef.current.currentTime(videoCurrentTime);
      }

      if (selectedLecture.chapters && selectedLecture.chapters.length) {
        addChapterMarkers(playerRef.current, selectedLecture);
      }

      enhanceScrubbing(playerRef.current);
    } catch (error) {
      //      console.error("Error in handleVideoLoaded:", error);
    }
  };

  const handleVideoEnded = async () => {
    if (!selectedLecture) return;

    try {
      const currentTime = playerRef.current.currentTime();
      const duration = playerRef.current.duration();

      if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
        //        console.log("Invalid video times, not saving progress");
        return;
      }

      const response = await useAxios().post(
        `/lecture/${selectedLecture.id}/progress/`,
        {
          current_time: currentTime,
          duration: duration,
        }
      );

      if (response.data) {
        const wasCompleted =
          lectureProgress[selectedLecture.id]?.completed || false;
        const isNowCompleted = response.data.completed || false;

        setLectureProgress((prev) => ({
          ...prev,
          [selectedLecture.id]: {
            percentage: response.data.percentage_complete || 0,
            completed: response.data.completed || false,
            current_time: response.data.current_time || 0,
          },
        }));

        if (!wasCompleted && isNowCompleted) {
          fetchCourseProgress();
        }
      }
    } catch (error) {
      //      console.error("Error saving video progress:", error);
    }
  };

  const handleTimeUpdate = () => {
    if (!playerRef.current || !selectedLecture) return;

    try {
      const currentTime = playerRef.current.currentTime();
      const duration = playerRef.current.duration();

      if (isNaN(currentTime) || isNaN(duration) || duration <= 0) return;

      const formattedCurrentTime = formatTime(currentTime);
      const formattedDuration = formatTime(duration);

      //      console.log(`Video time: ${formattedCurrentTime} / ${formattedDuration}`);

      setVideoCurrentTime(currentTime);

      const percentage = Math.round((currentTime / duration) * 100);

      setLectureProgress((prev) => ({
        ...prev,
        [selectedLecture.id]: {
          ...prev[selectedLecture.id],
          percentage: percentage,
          current_time: currentTime,
        },
      }));

      const lastSaveTime = playerRef.current.lastProgressSave || 0;
      if (currentTime - lastSaveTime >= 10) {
        saveVideoProgress();
        playerRef.current.lastProgressSave = currentTime;
      }
    } catch (error) {
      //      console.error("Error in handleTimeUpdate:", error);
    }
  };

  const saveVideoProgress = async () => {
    if (!playerRef.current || !selectedLecture) return;

    try {
      const currentTime = playerRef.current.currentTime();
      const duration = playerRef.current.duration();

      if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
        //        console.log("Invalid video times, not saving progress");
        return;
      }

      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }

      progressUpdateTimeoutRef.current = setTimeout(async () => {
        try {
          //          console.log(
          //            `Saving progress: lecture=${selectedLecture.id}, time=${currentTime.toFixed(2)}/${duration.toFixed(2)}`
          //          );
          const response = await useAxios().post(
            `/lecture/${selectedLecture.id}/progress/`,
            {
              current_time: currentTime,
              duration: duration,
            }
          );

          if (response.data) {
            const wasCompleted =
              lectureProgress[selectedLecture.id]?.completed || false;
            const isNowCompleted = response.data.completed || false;

            setLectureProgress((prev) => ({
              ...prev,
              [selectedLecture.id]: {
                percentage: response.data.percentage_complete || 0,
                completed: response.data.completed || false,
                current_time: response.data.current_time || 0,
              },
            }));

            if (!wasCompleted && isNowCompleted) {
              fetchCourseProgress();
            }
          }
        } catch (error) {
          //          console.error("Error saving video progress:", error);
        }
      }, 1000);
    } catch (error) {
      //      console.error("Error in saveVideoProgress:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
        progressUpdateTimeoutRef.current = null;
      }

      if (playerRef.current && selectedLecture) {
        saveVideoProgress();
      }
    };
  }, [selectedLecture]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        //        console.log("Disposing player on component unmount.");
        try {
          if (playerRef.current.closeMenuHandler_) {
            document.removeEventListener(
              "click",
              playerRef.current.closeMenuHandler_
            );
            //            console.log("Removed speed menu close handler.");
          }
          playerRef.current.dispose();
        } catch (e) {
          //          console.error("Error disposing player on unmount:", e);
        } finally {
          playerRef.current = null;
        }
      }
    };
  }, []);

  const enhanceScrubbing = (player) => {
    if (!player) return;

    player.ready(() => {
      //      console.log(
      //        "Setting up enhanced video scrubbing with keyframe simulation"
      //      );

      const videoEl = player.tech().el_;
      videoEl.preload = "auto";

      const createVirtualKeyframes = (duration) => {
        if (!duration || isNaN(duration) || duration <= 0) return null;

        const keyframeInterval = 2;
        const keyframes = [];

        //        console.log(
        //          `Creating virtual keyframes for video with duration ${formatTime(duration)}:`
        //        );
        //        console.log(`Using keyframe interval: ${keyframeInterval} seconds`);

        const keyframeInfo = [];

        for (let time = 0; time <= duration; time += keyframeInterval) {
          const position = time / duration;

          keyframes.push({
            time: time,
            position: position,
          });

          keyframeInfo.push({
            index: keyframes.length - 1,
            time: time.toFixed(2) + "s",
            position: (position * 100).toFixed(2) + "%",
            formatTime: formatTime(time),
          });
        }

        //        console.log(
        //          `Created ${keyframes.length} virtual keyframes for ${formatTime(duration)} video`
        //        );
        //        console.table(keyframeInfo);

        if (keyframes.length > 0) {
          //          console.log(
          //            `First keyframe: ${keyframes[0].time.toFixed(2)}s (${(keyframes[0].position * 100).toFixed(2)}%)`
          //          );

          if (keyframes.length >= 3) {
            const midIndex = Math.floor(keyframes.length / 2);
            //            console.log(
            //              `Middle keyframe: ${keyframes[midIndex].time.toFixed(2)}s (${(keyframes[midIndex].position * 100).toFixed(2)}%)`
            //            );
          }

          const lastIndex = keyframes.length - 1;
          //          console.log(
          //            `Last keyframe: ${keyframes[lastIndex].time.toFixed(2)}s (${(keyframes[lastIndex].position * 100).toFixed(2)}%)`
          //          );
        }

        return keyframes;
      };

      const findClosestKeyframe = (keyframes, targetTime) => {
        if (!keyframes || keyframes.length === 0) return null;

        let closest = keyframes[0];
        let minDiff = Math.abs(targetTime - closest.time);

        for (let i = 1; i < keyframes.length; i++) {
          const diff = Math.abs(targetTime - keyframes[i].time);
          if (diff < minDiff) {
            minDiff = diff;
            closest = keyframes[i];
          }
        }

        return closest;
      };

      let virtualKeyframes = null;

      player.on("loadedmetadata", () => {
        const duration = player.duration();
        if (duration && duration > 0) {
          virtualKeyframes = createVirtualKeyframes(duration);
        }
      });

      player.on("seeking", () => {
        //        console.log(`Seeking started at: ${player.currentTime().toFixed(2)}s`);
        player.addClass("vjs-seeking");
      });

      player.on("seeked", () => {
        //        console.log(
        //          `Seeking completed at: ${player.currentTime().toFixed(2)}s`
        //        );
        player.removeClass("vjs-seeking");

        setVideoCurrentTime(player.currentTime());
      });

      const progressHolder = player.el().querySelector(".vjs-progress-holder");
      if (!progressHolder) {
        //        console.error("Progress holder not found");
        return;
      }

      const handleProgressClick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        const rect = progressHolder.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));

        const duration = player.duration();

        if (isNaN(duration) || duration <= 0) {
          //          console.error("Invalid video duration:", duration);
          return false;
        }

        let newTime = percentage * duration;

        if (virtualKeyframes) {
          const closestKeyframe = findClosestKeyframe(
            virtualKeyframes,
            newTime
          );
          if (closestKeyframe) {
            const diff = Math.abs(newTime - closestKeyframe.time);
            if (diff < 0.5) {
              //              console.log(
              //                `Snapping to nearby keyframe at ${closestKeyframe.time.toFixed(2)}s`
              //              );
              newTime = closestKeyframe.time;
            }
          }
        }

        //        console.log(
        //          `Seeking to ${newTime.toFixed(2)}s (${(percentage * 100).toFixed(1)}%)`
        //        );

        try {
          player.addClass("vjs-seeking");

          setVideoCurrentTime(newTime);

          const wasPlaying = !player.paused();
          if (wasPlaying) player.pause();

          videoEl.currentTime = newTime;

          player.currentTime(newTime);

          const seekedHandler = function () {
            if (wasPlaying) player.play();
            player.off("seeked", seekedHandler);
          };

          player.on("seeked", seekedHandler);

          setTimeout(() => {
            saveVideoProgress();
          }, 500);
        } catch (error) {
          //          console.error("Error during seek operation:", error);
          player.removeClass("vjs-seeking");
        }

        return false;
      };

      progressHolder.onclick = null;
      if (progressHolder._clickHandler) {
        progressHolder.removeEventListener(
          "click",
          progressHolder._clickHandler
        );
      }

      progressHolder._clickHandler = handleProgressClick;
      progressHolder.addEventListener("click", handleProgressClick);

      const enhanceBufferDisplay = () => {
        const updateBufferDisplay = () => {
          try {
            const buffered = player.buffered();
            const duration = player.duration();

            if (!buffered || !duration) return;

            const bufferBar = player.el().querySelector(".vjs-load-progress");
            if (!bufferBar) return;

            bufferBar.innerHTML = "";

            for (let i = 0; i < buffered.length; i++) {
              const start = (buffered.start(i) / duration) * 100;
              const width =
                ((buffered.end(i) - buffered.start(i)) / duration) * 100;

              const div = document.createElement("div");
              div.className = "vjs-load-progress-segment";
              div.style.left = start + "%";
              div.style.width = width + "%";
              bufferBar.appendChild(div);
            }
          } catch (e) {
            //            console.error("Error updating buffer display:", e);
          }
        };

        player.on("progress", updateBufferDisplay);
      };

      const style = document.createElement("style");
      style.textContent = `
      .video-js.vjs-seeking .vjs-loading-spinner {
        display: block;
        opacity: 0.8;
        visibility: visible;
      }
      
      .video-js .vjs-progress-holder:hover {
        cursor: pointer;
        height: 6px;
      }
      
      .video-js .vjs-play-progress {
        background-color: generate-color;
      }
      
      .video-js .vjs-time-tooltip {
        padding: 2px 5px;
        background-color: #000;
        border-radius: 3px;
      }
      
     
      .video-js .vjs-load-progress-segment {
        background-color: rgba(255, 255, 255, 0);
      }
    `;
      player.el().appendChild(style);

      enhanceBufferDisplay();

      //      console.log(
      //        "Enhanced seek handler with virtual keyframes installed successfully"
      //      );
    });
  };

  const formatTime = (seconds) => {
    if (
      seconds === null ||
      seconds === undefined ||
      isNaN(seconds) ||
      seconds < 0
    ) {
      return "0:00";
    }

    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, 0)}`;
  };

  const addChapterMarkers = (player, lecture) => {
    if (!player || !lecture.chapters || !lecture.chapters.length) return;

    player.ready(() => {
      const duration = player.duration();
      if (!duration) return;

      let markersContainer = player.el().querySelector(".vjs-chapter-markers");
      if (!markersContainer) {
        markersContainer = document.createElement("div");
        markersContainer.className = "vjs-chapter-markers";
        markersContainer.style.position = "absolute";
        markersContainer.style.bottom = "34px";
        markersContainer.style.width = "100%";
        markersContainer.style.height = "3px";
        markersContainer.style.pointerEvents = "none";

        const progressControl = player
          .el()
          .querySelector(".vjs-progress-control");
        if (progressControl) {
          progressControl.appendChild(markersContainer);
        }
      }

      markersContainer.innerHTML = "";

      lecture.chapters.forEach((chapter) => {
        const marker = document.createElement("div");
        marker.className = "vjs-chapter-marker";
        marker.style.position = "absolute";
        marker.style.height = "100%";
        marker.style.width = "2px";
        marker.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
        marker.style.left = `${(chapter.time / duration) * 100}%`;

        markersContainer.appendChild(marker);
      });
    });
  };

  const handleSeeking = () => {
    if (!playerRef.current || !selectedLecture) return;

    try {
      const currentTime = playerRef.current.currentTime();
      //      console.log(`Seeking started at position: ${currentTime.toFixed(2)}s`);
    } catch (error) {
      //      console.error("Error in handleSeeking:", error);
    }
  };

  const handleSeeked = () => {
    if (!playerRef.current || !selectedLecture) return;

    try {
      const currentTime = playerRef.current.currentTime();
      //      console.log(`Seeking ended at position: ${currentTime.toFixed(2)}s`);

      setVideoCurrentTime(currentTime);

      setTimeout(() => saveVideoProgress(), 300);
    } catch (error) {
      //      console.error("Error in handleSeeked:", error);
    }
  };

  const downloadResource = (resource) => {
    const link = document.createElement("a");

    fetch(resource.file_url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);

        link.href = blobUrl;
        link.download =
          resource.title + (resource.file_type ? "." + resource.file_type : "");
        link.target = "_self";

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch((error) => {
        //        console.error("Download failed:", error);
        Toast().fire({
          icon: "error",
          title: "Download failed. Please try again.",
        });
      });
  };

  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      // This is the correct endpoint for course categories
      const response = await useAxios().get("/course/category/");
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      //      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingScreen(false);
    }, 3000);

    const userId = UserData()?.user_id;
    if (!userId) {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      navigate("/");
      return;
    }

    fetchData();
    fetchCourseProgress();
    fetchCategories(); // Add this line to fetch categories

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem("user_cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);

        const total = parsedCart.reduce((sum, item) => {
          const price =
            typeof item.price === "string"
              ? parseFloat(item.price)
              : item.price;
          return sum + (isNaN(price) ? 0 : price);
        }, 0);

        setOrderTotal(total);
      } catch (e) {
        //        console.error("Error parsing cart from localStorage:", e);
      }
    }

    const savedCartId = localStorage.getItem("cart_id");
    if (savedCartId) {
      setCartId(savedCartId);
    }
  }, []);

  useEffect(() => {
    const loadUserCart = async () => {
      try {
        const userId = UserData()?.user_id;
        if (!userId) return;

        const savedCart = localStorage.getItem("user_cart");
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            setCart(parsedCart);

            const total = parsedCart.reduce((sum, item) => {
              const price =
                typeof item.price === "string"
                  ? parseFloat(item.price)
                  : item.price;
              return sum + (isNaN(price) ? 0 : price);
            }, 0);

            setOrderTotal(total);
          } catch (e) {
            //            console.error("Error parsing cart from localStorage:", e);
          }
        } else {
          const cartIdToUse = localStorage.getItem("cart_id");
          if (cartIdToUse) {
            const response = await useAxios().get(
              `/course/cart-list/${cartIdToUse}/`
            );
            if (response.data && Array.isArray(response.data)) {
              const backendCart = response.data.map((item) => ({
                id: item.course.id,
                title: item.course.title,
                price: parseFloat(item.price).toFixed(2),
                image: item.course.image,
                level: item.course.level,
                cartId: cartIdToUse,
              }));

              setCart(backendCart);
              localStorage.setItem("user_cart", JSON.stringify(backendCart));

              const total = backendCart.reduce((sum, item) => {
                const price =
                  typeof item.price === "string"
                    ? parseFloat(item.price)
                    : item.price;
                return sum + (isNaN(price) ? 0 : parseFloat(price));
              }, 0);

              setOrderTotal(total);
            }
          }
        }
      } catch (error) {
        //        console.error("Error loading cart:", error);
      }
    };

    loadUserCart();
  }, []);

  useEffect(() => {
    const initializeCart = async () => {
      const userId = UserData()?.user_id;
      if (!userId) return;

      //      console.log("Initializing persistent cart for user:", userId);

      let cartIdToUse = localStorage.getItem("cart_id");

      const expectedCartId = `user_${userId}`;

      if (!cartIdToUse || !cartIdToUse.includes(userId)) {
        cartIdToUse = expectedCartId;
        localStorage.setItem("cart_id", cartIdToUse);
        setCartId(cartIdToUse);
        //        console.log("Created new persistent cart ID:", cartIdToUse);
      } else {
        //        console.log("Using existing cart ID:", cartIdToUse);
      }

      try {
        const response = await useAxios().get(
          `/course/cart-list/${cartIdToUse}/`
        );

        if (response.data && Array.isArray(response.data)) {
          const backendCart = response.data.map((item) => ({
            id: item.course.id,
            title: item.course.title,
            price: parseFloat(item.price).toFixed(2),
            image: item.course.image,
            level: item.course.level,
          }));

          setCart(backendCart);

          const total = backendCart.reduce((sum, item) => {
            const price =
              typeof item.price === "string"
                ? parseFloat(item.price)
                : item.price;
            return sum + (isNaN(price) ? 0 : parseFloat(price));
          }, 0);

          setOrderTotal(total);
          //          console.log(
          //            "Loaded persistent cart with",
          //            backendCart.length,
          //            "items"
          //          );
        }
      } catch (error) {
        //        console.error("Error loading cart:", error);
      }
    };

    initializeCart();
  }, [UserData()?.user_id]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus === "success") {
      Toast().fire({
        icon: "success",
        title: "Payment Successful!",
        text: "Your course enrollment is complete. You can now access your courses.",
      });

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      const orderOid = urlParams.get("order");
      if (orderOid) {
        //        console.log(`Order ID: ${orderOid}`);

        fetchData();

        setCart([]);
        const userId = UserData()?.user_id;
        if (userId) {
          const cartIdToUse = `user_${userId}`;
          localStorage.removeItem("user_cart");
          clearCart();
        }
      }
    }
  }, []);

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredCourses = () => {
    if (!Array.isArray(courses)) return [];

    let filtered = [...courses];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((course) => {
        if (
          statusFilter === "published" &&
          course.platform_status === "Published"
        )
          return true;
        if (statusFilter === "draft" && course.platform_status !== "Published")
          return true;
        return false;
      });
    }

    // Apply category filter
    if (selectedCourseCategory !== "all") {
      filtered = filtered.filter(
        (course) => course.category_id === selectedCourseCategory
      );
    }

    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.date || b.created_at || 0) -
          new Date(a.date || a.created_at || 0)
      );
    } else if (sortBy === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.date || a.created_at || 0) -
          new Date(b.date || b.created_at || 0)
      );
    } else if (sortBy === "title_asc") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "title_desc") {
      filtered.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }

    return filtered;
  };

  const openPopup = (category) => {
    setPopupCategory(category);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupCategory(null);
  };

  const handleDeleteCourse = async (courseId) => {
  if (!window.confirm("Are you sure you want to delete this course?")) return;
  try {
    await useAxios().delete(`/teacher/course/${courseId}/`);
    Toast().fire({ icon: "success", title: "Course deleted" });
    fetchData(); // Refresh course list
  } catch (err) {
    Toast().fire({ icon: "error", title: "Failed to delete course" });
  }
};

const handleShowEditModal = (course) => {
  setCourseForm({
    id: course.id,
    title: course.title || "",
    price: course.price || "",
    level: course.level || "",
    category: course.category_id || "",
  });
  setShowCreateCourseModal(true);
};
  const openAddMorePopup = async () => {
    await fetchUnboughtCourses();
    await fetchUserSubscription();
    await syncCartWithBackend();
    setShowAddMorePopup(true);
  };

  const closeAddMorePopup = () => {
    setShowAddMorePopup(false);
  };

  const addToLibrary = async (courseId) => {
    try {
      //      console.log("Adding course to library:", courseId);

      const response = await useAxios().post("/subscription/add-courses/", {
        course_id: courseId,
      });

      //      console.log("Library add response:", response.data);

      if (response.data.message) {
        if (response.data.courses && response.data.courses.length > 0) {
          const addedCourse = response.data.courses[0];

          const formattedCourse = {
            course: addedCourse,
            completed_lesson: [],
            date: new Date().toISOString(),
          };

          setCourses((prevCourses) => [...prevCourses, formattedCourse]);

          fetchData();

          Toast().fire({
            icon: "success",
            title: `${addedCourse.title} added to your courses!`,
          });

          setUnboughtCourses(unboughtCourses.filter((c) => c.id !== courseId));
        } else {
          Toast().fire({
            icon: "success",
            title: "Course added to your library!",
          });

          fetchData();
          fetchUnboughtCourses();
        }
      }
    } catch (error) {
      //      console.error("Error adding course to library:", error);
      if (error.response && error.response.data) {
        //        console.error("Server error details:", error.response.data);
      }
      Toast().fire({
        icon: "error",
        title: "Failed to add course to your library.",
      });
    }
  };

  const addToCart = async (course) => {
    try {
      const price =
        typeof course.price === "string"
          ? parseFloat(course.price)
          : course.price;

      if (isNaN(price)) {
        //        console.error("Invalid price:", course.price);
        Toast().fire({
          icon: "error",
          title: "Cannot add course with invalid price.",
        });
        return;
      }

      const isInCart = cart.some((item) => item.id === course.id);
      if (isInCart) {
        Toast().fire({
          icon: "info",
          title: "This course is already in your cart",
        });
        return;
      }

      const userId = UserData()?.user_id;
      if (!userId) {
        Toast().fire({
          icon: "error",
          title: "You must be logged in to add items to cart",
        });
        return;
      }

      const cartIdToUse = `user_${userId}`;
      localStorage.setItem("cart_id", cartIdToUse);

      await useAxios().post("/course/cart/", {
        course_id: course.id,
        user_id: userId,
        price: price,
        country_name: "South Africa",
        cart_id: cartIdToUse,
      });

      await refreshCartFromBackend(cartIdToUse);

      Toast().fire({
        icon: "success",
        title: `${course.title} added to cart!`,
      });
    } catch (error) {
      //      console.error("Error adding to cart:", error.response || error);
      Toast().fire({
        icon: "error",
        title: "Failed to add course to cart.",
      });
    }
  };

  const removeFromCart = async (courseId) => {
    try {
      const userId = UserData()?.user_id;
      if (!userId) {
        Toast().fire({
          icon: "error",
          title: "You must be logged in to manage your cart",
        });
        return;
      }

      const cartIdToUse = localStorage.getItem("cart_id") || `user_${userId}`;

      //      console.log(`Removing course ${courseId} from cart ${cartIdToUse}`);

      await useAxios().delete(
        `/course/cart-item-delete/${cartIdToUse}/${courseId}/`
      );

      await refreshCartFromBackend(cartIdToUse);

      Toast().fire({
        icon: "success",
        title: "Item removed from cart",
      });
    } catch (error) {
      //      console.error("Error removing from cart:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to remove item from cart",
      });
    }
  };

  const calculateTotal = () => {
    const total = cart.reduce((sum, item) => {
      const price =
        typeof item.price === "string" ? parseFloat(item.price) : item.price;
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    return total;
  };

  const payWithYoco = async () => {
    try {
      setPaymentLoading(true);

      if (cart.length === 0) {
        Toast().fire({
          icon: "warning",
          title: "Your cart is empty!",
        });
        return;
      }

      const userId = UserData()?.user_id;
      if (!userId) {
        Toast().fire({
          icon: "error",
          title: "You must be logged in to checkout",
        });
        return;
      }

      const cartIdToUse = `user_${userId}`;

      const orderResponse = await useAxios().post("/order/create-order/", {
        full_name: UserData()?.full_name || "",
        email: UserData()?.email || "",
        country: "South Africa",
        cart_id: cartIdToUse,
        user_id: userId,
      });

      if (!orderResponse.data || !orderResponse.data.order_oid) {
        throw new Error("Failed to create order");
      }

      const orderOid = orderResponse.data.order_oid;
      //      console.log("Order created successfully:", orderOid);

      const response = await useAxios().post("/payment/create-checkout/", {
        order_oid: orderOid,
        amount: calculateTotal() * 100,
      });

      if (response.data && response.data.redirectUrl) {
        Toast().fire({
          icon: "info",
          title: "Redirecting to payment page...",
        });

        window.location.href = response.data.redirectUrl;
      } else {
        throw new Error("No redirect URL received from payment processor");
      }
    } catch (error) {
      //      console.error("Payment error:", error);

      let errorMessage = "Payment processing error. Please try again.";

      if (error.response && error.response.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
        if (error.response.data.details) {
          //          console.error("Error details:", error.response.data.details);
        }
      }

      Toast().fire({
        icon: "error",
        title: errorMessage,
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      const cartIdToUse = localStorage.getItem("cart_id");
      if (!cartIdToUse) return;

      for (const item of cart) {
        await useAxios().delete(
          `/course/cart-item-delete/${cartIdToUse}/${item.id}/`
        );
      }

      await syncCartWithBackend();

      Toast().fire({
        icon: "success",
        title: "Cart cleared",
      });
    } catch (error) {
      //      console.error("Error clearing cart:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to clear cart",
      });
    }
  };

  const syncCartWithBackend = async (forceRefresh = false) => {
    try {
      const userId = UserData()?.user_id;
      if (!userId) return;

      //      console.log("Syncing cart with backend for user:", userId);

      let cartIdToUse = localStorage.getItem("cart_id");
      if (!cartIdToUse || forceRefresh) {
        const timestamp = new Date().getTime();
        const randomStr = Math.random().toString(36).substring(2, 8);
        cartIdToUse = `cart_${timestamp}_${randomStr}_${userId}`;
        localStorage.setItem("cart_id", cartIdToUse);
        setCartId(cartIdToUse);
        //        console.log("Created new cart ID:", cartIdToUse);
      }

      const response = await useAxios().get(
        `/course/cart-list/${cartIdToUse}/`
      );

      if (response.data && Array.isArray(response.data)) {
        const backendCart = response.data.map((item) => ({
          id: item.course.id,
          title: item.course.title,
          price: parseFloat(item.price).toFixed(2),
          image: item.course.image,
          level: item.course.level,
          cartItemId: item.id,
        }));

        setCart(backendCart);

        const total = backendCart.reduce((sum, item) => {
          const price =
            typeof item.price === "string"
              ? parseFloat(item.price)
              : item.price;
          return sum + (isNaN(price) ? 0 : parseFloat(price));
        }, 0);

        setOrderTotal(total);
        //        console.log("Cart synced from backend:", backendCart);
      } else {
        setCart([]);
        setOrderTotal(0);
        //        console.log("No cart items found on backend, cleared local cart");
      }
    } catch (error) {
      //      console.error("Error syncing cart with backend:", error);
    }
  };

  const openCartPopup = async () => {
    await syncCartWithBackend();
    setShowCartPopup(true);
  };

  const refreshCartFromBackend = async (cartIdToUse) => {
    try {
      if (!cartIdToUse) {
        cartIdToUse = localStorage.getItem("cart_id");
        if (!cartIdToUse) return;
      }

      //      console.log(`Refreshing cart with ID: ${cartIdToUse}`);

      const response = await useAxios().get(
        `/course/cart-list/${cartIdToUse}/`
      );

      if (response.data && Array.isArray(response.data)) {
        const backendCart = response.data.map((item) => ({
          id: item.course.id,
          title: item.course.title,
          price: parseFloat(item.price).toFixed(2),
          image: item.course.image,
          level: item.course.level,
        }));

        setCart(backendCart);

        const total = backendCart.reduce((sum, item) => {
          const price =
            typeof item.price === "string"
              ? parseFloat(item.price)
              : item.price;
          return sum + (isNaN(price) ? 0 : parseFloat(price));
        }, 0);

        setOrderTotal(total);
        //        console.log(`Cart refreshed, found ${backendCart.length} items`);
      }
    } catch (error) {
      //      console.error("Error refreshing cart:", error);
    }
  };

  const proceedToCheckout = () => {
    setShowCartPopup(false);

    setShowCheckoutPopup(true);
  };

  const categorizedCourses = {
    Beginner: courses.filter((c) => c.course && c.course.level === "Beginner"),
    Intermediate: courses.filter(
      (c) => c.course && c.course.level === "Intermediate"
    ),
    Advanced: courses.filter((c) => c.course && c.course.level === "Advanced"),
  };

  const fetchCourseProgress = async () => {
    try {
      const userId = UserData()?.user_id;
      if (!userId) return;

      const response = await useAxios().get(`/student/${userId}/progress/`);

      if (response.data && Array.isArray(response.data)) {
        const progressData = {};

        response.data.forEach((item) => {
          progressData[item.course_id] = {
            percentage: item.progress || 0,
            completed_lectures: item.completed_lectures || 0,
            total_lectures: item.total_lectures || 0,
          };
        });

        setCourseProgress(progressData);
      }
    } catch (error) {
      //      console.error("Error fetching course progress:", error);
    }
  };

  const fetchLectureProgress = async (lectureId) => {
    try {
      const response = await useAxios().get(`/lecture/${lectureId}/progress/`);

      if (response.data) {
        setLectureProgress((prev) => ({
          ...prev,
          [lectureId]: {
            percentage: response.data.percentage_complete || 0,
            completed: response.data.completed || false,
            current_time: response.data.current_time || 0,
          },
        }));

        return response.data;
      }
    } catch (error) {
      //      console.error("Error fetching lecture progress:", error);
      return null;
    }
  };

  useEffect(() => {
    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }

      if (playerRef.current && selectedLecture) {
        saveVideoProgress();
      }
    };
  }, [selectedLecture]);

  // Add this helper function for file icons
  const getResourceIcon = (fileType) => {
    if (!fileType) return "file";

    fileType = fileType.toLowerCase();

    if (fileType === "pdf") return "file-pdf";
    if (["doc", "docx"].includes(fileType)) return "file-word";
    if (["xls", "xlsx"].includes(fileType)) return "file-excel";
    if (["ppt", "pptx"].includes(fileType)) return "file-powerpoint";
    if (["jpg", "jpeg", "png", "gif"].includes(fileType)) return "file-image";
    if (["mp3", "wav", "ogg"].includes(fileType)) return "file-audio";
    if (["mp4", "mov", "avi"].includes(fileType)) return "file-video";
    if (["zip", "rar", "7z"].includes(fileType)) return "file-archive";

    return "file";
  };

  const formatFileSize = (bytes) => {
    // Handle invalid inputs
    if (bytes === null || bytes === undefined || isNaN(bytes)) {
      return "Unknown size";
    }

    // Handle zero bytes case
    if (bytes === 0) return "0 KB";

    // Define size units (starting from KB, not Bytes)
    const sizes = ["KB", "MB", "GB", "TB"];

    // If smaller than 1KB, just show as 1KB
    if (bytes < 1024) {
      return "1 KB";
    }

    // Convert bytes to KB before calculation
    const sizeInKB = bytes / 1024;

    // Calculate the appropriate unit index (0=KB, 1=MB, 2=GB, 3=TB)
    const i = Math.floor(Math.log(sizeInKB) / Math.log(1024));

    // Format with appropriate precision:
    // - 0 decimal places for KB (i=0)
    // - 1 decimal place for MB (i=1)
    // - 2 decimal places for GB and TB (i≥2)
    let decimals = 0;
    if (i === 1) decimals = 1;
    else if (i >= 2) decimals = 2;

    // Calculate the display value in the chosen unit
    const formattedSize = (sizeInKB / Math.pow(1024, i)).toFixed(decimals);

    // Return formatted size with unit (KB, MB, GB, TB)
    return `${formattedSize} ${sizes[i]}`;
  };

  useEffect(() => {
    async function fetchDarkModeSetting() {
      try {
        const response = await useAxios().get("/user/appearance-settings/");
        if (response.data && response.data.dark_mode !== undefined) {
          setDarkMode(response.data.dark_mode);
          //          console.log("Dark mode setting loaded:", response.data.dark_mode);
        }
      } catch (error) {
        //        console.error("Error fetching dark mode setting:", error);
      }
    }

    fetchDarkModeSetting();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? "80px" : "270px",
          transition: "margin-left 0.3s ease",
          paddingTop: "60px", 
        }}
      >
        {/* Header */}
        <div
          style={{
          position: "fixed",
          top: 0,
          left: sidebarCollapsed ? "80px" : "270px",
          width: `calc(100% - ${sidebarCollapsed ? "80px" : "270px"})`,
          zIndex: 2000,
          transition: "left 0.3s, width 0.3s",
        }}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        >
          <button
            className="btn btn-secondary"
            onClick={proceedToCheckout}
            style={{ marginLeft: "auto" }}
          >
            Cart ({cart.length})
          </button>
        </Header>
      </div>

      {/* Courses Section */}
      <div style={{ padding:"20px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>My Courses</h3>
          <Button variant="primary" onClick={() => setShowCreateCourseModal(true)}>
          <i className="fas fa-plus me-2"></i> Create Course
          </Button>
        </div>

        {/* Filters Row */}
        <div className="mb-4">
          <Row>
            <Col md={3} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label>Filter by Category</Form.Label>
                <Form.Select

                  value={selectedCourseCategory}
                  onChange={(e) => setSelectedCourseCategory(e.target.value)}
                  className={
                    darkMode ? "bg-dark text-white border-secondary" : ""
                  }
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={
                    darkMode ? "bg-dark text-white border-secondary" : ""
                  }
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={
                    darkMode ? "bg-dark text-white border-secondary" : ""
                  }
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="title_desc">Title (Z-A)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={
                    darkMode ? "bg-dark text-white border-secondary" : ""
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
{/* Edit Course Button Handler */}

        {/* Update your createCourseModal to handle both create and edit */}
        <Modal
          show={showCreateCourseModal}
          onHide={() => {
            setShowCreateCourseModal(false);
            setCourseForm({
              title: "",
              price: "",
              level: "",
              category: "",
            });
          }}
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>{courseForm.id ? "Edit Course" : "Create Course"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const formData = new FormData();
                  formData.append("title", courseForm.title);
                  formData.append("price", courseForm.price);
                  formData.append("level", courseForm.level);
                  if (courseForm.category) formData.append("category", courseForm.category);
                  if (e.target.image.files[0]) formData.append("image", e.target.image.files[0]);

                  if (courseForm.id) {
                    // Update existing course
                    await useAxios().put(`teacher/course-update/${UserData().teacher_id}/${courseForm.id}/`, formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });
                    Toast().fire({
                      icon: "success",
                      title: "Course updated successfully"
                    });
                  } else {
                    // Create new course
                    await useAxios().post("teacher/course-create/", formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });
                    Toast().fire({
                      icon: "success",
                      title: "Course created successfully"
                    });
                  }
                  
                  setShowCreateCourseModal(false);
                  setCourseForm({
                    title: "",
                    price: "",
                    level: "",
                    category: "",
                  });
                  fetchData();
                } catch (err) {
                  Toast().fire({
                    icon: "error",
                    title: courseForm.id ? "Failed to update course." : "Failed to create course."
                  });
                }
              }}
            >
              <Form.Group className="mb-3">
                <Form.Label>
                  Course Title <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Price <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={courseForm.price}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, price: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Level <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={courseForm.level}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, level: e.target.value })
                  }
                  required
                >
                  <option value="">Select Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category (optional)</Form.Label>
                <div className="d-flex">
                  <Form.Select
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        category: e.target.value,
                      })
                    }
                    style={{ flex: 1 }}
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </Form.Select>
                  <Button
                    variant="outline-primary"
                    className="ms-2"
                    onClick={() => setAddingCategory(true)}
                  >
                    Add Category
                  </Button>
                </div>
              </Form.Group>
              {addingCategory && (
                <Form.Group className="mb-3">
                  <Form.Label>New Category</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Category name"
                    />
                    <Button
                      variant="success"
                      className="ms-2"
                      onClick={async () => {
                        if (!newCategory.trim()) return;
                        try {
                          const res = await useAxios().post("course/category/", {
                            title: newCategory,
                          });
                          setCategories([...categories, res.data]);
                          setCourseForm({
                            ...courseForm,
                            category: res.data.id,
                          });
                          setNewCategory("");
                          setAddingCategory(false);
                        } catch {
                          Toast().fire({
                            icon: "error",
                            title: "Failed to add category.",
                          });
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="ms-2"
                      onClick={() => setAddingCategory(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Course Image</Form.Label>
                <Form.Control type="file" name="image" accept="image/*" />
              </Form.Group>
              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={() => {
                    setShowCreateCourseModal(false);
                    setCourseForm({
                      title: "",
                      price: "",
                      level: "",
                      category: "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {courseForm.id ? "Update" : "Create"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
        {/* Courses Grid */}
        {fetching ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading... </span>
            </Spinner>
          </div>
        ) : filteredCourses().length === 0 ? (
          <div className="text-center py-5">
            <p>No courses found.</p>
            <Button variant="primary" onClick={handleShowCreateModal}>
              <i className="fas fa-plus me-2"></i> Create Your First Course
            </Button>
          </div>
        ) : (
          <Row>
            {filteredCourses().map((course) => (
              <Col key={course.id} md={6} lg={4} xl={3} className="mb-4">
                <Card
                  className={`h-100 ${darkMode ? "bg-dark text-white" : ""}`}
                  onClick={() => navigate(`/teacher/courses/${course.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="position-relative">
                    {/* Course Image */}
                    <div
                      className="course-image"
                      style={{
                        height: "180px",
                        backgroundColor: "#fffff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {course.image ? (
                        <img
                          src={course.image}
                          alt="course"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#4286f4",
                            color: "white",
                            fontSize: "32px",
                            fontWeight: "bold",
                          }}
                        >
                          {course.title && typeof course.title === "string"
                            ? course.title.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}

                      {/* Status Badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                        }}
                      >
                        <Badge
                          bg={
                            course.platform_status === "Published"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {course.platform_status || "Draft"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="text-truncate">
                      {course.title}
                    </Card.Title>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Badge bg="info">{course.level}</Badge>
                      <small>
                        {moment(course.date).format("MMM D, YYYY")}
                      </small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <span className="fw-bold">
                        R{parseFloat(course.price || 0).toFixed(2)}
                      </span>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowEditModal(course);
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant={darkMode ? "dark" : "light"}
                          style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await openLecturePopup(course);
                          }}
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>

    {/* Lecture Popup */}
    {showLecturePopup && selectedCourse && (
      <div
        className={`lecture-popup ${darkMode ? "dark" : ""}`}
        style={{
          position: "fixed",
          top: "60px" /* Position below header height */,
          left: sidebarCollapsed ? "80px" : "270px" /* Match sidebar width */,
          width: `calc(100% - ${sidebarCollapsed ? "80px" : "270px"})`,
          height: "calc(100vh - 60px)" /* Take remaining height */,
          backgroundColor: darkMode ? "#fff" : "#fff",
          color: darkMode ? "#e0e0e0" : "inherit",
          zIndex: 1000,
          display: "flex",
          overflow: "hidden",
          transition: "left 0.3s ease, width 0.3s ease",
        }}
      >
        {/* Left Section: Video Player and Description/Resources */}
        <div
          style={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%" /* Use full height of container */,
            overflow: "hidden",
            borderRight: darkMode ? "1px solid #333" : "1px solid #ddd",
          }}
        >
          {/* Video Player Container */}
          <div
            ref={videoContainerRef} // Assign the ref here
            style={{
              width: "100%",
              height: "60%", // Or desired aspect ratio/height
              backgroundColor: "#000", // Background while loading
              position: "relative", // Needed for the loading spinner overlay
              overflow: "hidden", // Ensure video fits container
            }}
          >
            {/* Loading Spinner Overlay */}
            {isVideoLoading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  zIndex: 10, // Ensure spinner is on top
                }}
              >
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            {/* The <video> element will be dynamically added here by handleLectureSelect */}
          </div>

          {/* Tabs for Description and Resources */}
          <div
            style={{
              display: "flex",
              borderBottom: darkMode ? "1px solid #333" : "1px solid #ddd",
              backgroundColor: darkMode ? "#1e1e1e" : "#f8f8f8",
              flexShrink: 0,
            }}
          >
            {/* Tab Buttons (Example) */}
            <div
              onClick={() => setActiveTab("description")}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                fontWeight: activeTab === "description" ? "bold" : "normal",
                color: darkMode ? "#e0e0e0" : "inherit",
              }}
            >
              Description
            </div>
            <div
              onClick={() => setActiveTab("resources")}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                fontWeight: activeTab === "resources" ? "bold" : "normal",
                color: darkMode ? "#e0e0e0" : "inherit",
              }}
            >
              Resources
            </div>
          </div>

          {/* Content Area Below Tabs */}
          <div
            style={{
              flex: 1,
              overflowY: "auto", 
              padding: "20px",
              backgroundColor: darkMode ? "#121212" : "#fff",
              color: darkMode ? "#e0e0e0" : "inherit",
            }}
          >
            {/* Conditional Content Based on Active Tab */}
            {activeTab === "description" && selectedLecture && (
              <div>
                <h4>{selectedLecture.title || "Lecture Title"}</h4>
                <p>
                  {selectedLecture.description ||
                    "Lecture description goes here..."}
                </p>
              </div>
            )}
            {activeTab === "resources" && (
              <div>
                <div
                  className="d-flex justify-content-between align-items-center"
                  style={{ marginBottom: 16 }}
                >
                  <h4 style={{ margin: 0 }}>Resources</h4>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setShowAddResourceModal(true)}
                  >
                    <FaPlus /> Add Resource
                  </Button>
                </div>
                {loadingResources ? (
                  <div className="d-flex justify-content-center my-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : lectureResources.length > 0 ? (
                  <div className="list-group mt-3">
                    {lectureResources.map((resource) => (
                      <div
                        key={resource.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          marginBottom: "8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                          border: darkMode ? "1px solid #333" : "1px solid #ddd",
                          color: darkMode ? "#e0e0e0" : "inherit",
                          transition: "background-color 0.2s ease",
                        }}
                        className="list-group-item-action"
                      >
                        <div className="d-flex align-items-center">
                          <i
                            className={`fas fa-${getResourceIcon(resource.file_type)} me-3 text-primary`}
                          ></i>
                          <div>
                            <h6
                              className="mb-0"
                              style={{
                                color: darkMode ? "#fff" : "inherit",
                              }}
                            >
                              {resource.title}
                            </h6>
                            <small
                              style={{
                                color: darkMode ? "#aaa" : "#6c757d",
                              }}
                            >
                              {resource.file_type?.toUpperCase() || "Unknown"} • {formatFileSize(resource.file_size)}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <Button
                            size="sm"
                            variant="light"
                            style={{
                              marginLeft: 8,
                              color: "#fff",
                              background: "#4285f4",
                              border: "1px solid #fff",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingResource(resource);
                              setShowEditResourceModal(true);
                            }}
                          >
                            <FaPencilAlt />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            style={{
                              marginLeft: 8,
                              color: "#fff",
                              background: "#dc3545",
                              border: "1px solid #fff",
                            }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm("Are you sure you want to delete this resource?")) {
                                try {
                                  await useAxios().delete(`resources/${resource.id}/`);
                                  Toast().fire({ icon: "success", title: "Resource deleted" });
                                  fetchLectureResources(selectedCourse.id, selectedLecture.id);
                                } catch {
                                  Toast().fire({ icon: "error", title: "Failed to delete resource." });
                                }
                              }
                            }}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedLecture ? (
                  <div
                    className="alert mt-3"
                    style={{
                      backgroundColor: darkMode ? "#2a3f54" : "#cff4fc",
                      color: darkMode ? "#8fcaff" : "#055160",
                      borderColor: darkMode ? "#1f3146" : "#b6effb",
                    }}
                  >
                    <i className="fas fa-info-circle me-2"></i>
                    No resources available for this lecture.
                  </div>
                ) : (
                  <p
                    style={{ color: darkMode ? "#aaa" : "#6c757d" }}
                    className="mt-3"
                  >
                    Select a lecture to view its resources.
                  </p>
                )}
              </div>
            )}
            {!selectedLecture && activeTab === "description" && (
              <p>Select a lecture to view its description.</p>
            )}
          </div>
        </div>

        {/* Right Section: Lecture List */}
        <div
          style={{
            width: "400px",
            backgroundColor: darkMode ? "#121212" : "#fff",
            color: darkMode ? "#e0e0e0" : "inherit",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Add Lecture Button */}
          <div
            style={{
              padding: "15px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "18px" }}>
              {selectedCourse.title}
            </div>
            <Button size="sm" variant="primary" onClick={handleAddLecture}>
              <FaPlus /> Add Lecture
            </Button>
            <button
              onClick={closeLecturePopup}
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                color: "#666",
                marginLeft: 8,
              }}
            >
              ×
            </button>
          </div>

          {/* Drag and Drop Lecture List */}
          <DragDropContext onDragEnd={handleLectureDragEnd}>
            <Droppable droppableId="lectures-droppable">
              {(provided) => (
                <ul
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    listStyle: "none",
                    padding: "10px 0",
                    margin: 0,
                    minHeight: 60,
                  }}
                >
                  {lectures.map((lecture, index) => {
                    const isSelected = selectedLecture?.id === lecture.id;
                    return (
                      <Draggable
                        key={lecture.id}
                        draggableId={lecture.id.toString()}
                        index={index}
                      >
                        {(providedDrag) => (
                          <li
                            ref={providedDrag.innerRef}
                            {...providedDrag.draggableProps}
                            style={{
                              ...providedDrag.draggableProps.style,
                              cursor: "pointer",
                              padding: "12px 20px",
                              backgroundColor: isSelected
                                ? "#4285f4"
                                : darkMode
                                  ? "#121212"
                                  : "transparent",
                              color: isSelected
                                ? "rgb(255, 255, 255)"
                                : darkMode
                                  ? "#e0e0e0"
                                  : "#333",
                              borderBottom: darkMode
                                ? "1px solid #333"
                                : "1px solid #ddd",
                              display: "flex",
                              alignItems: "center",
                              borderRadius: isSelected ? "5px" : "0",
                              margin: isSelected ? "0 5px" : "0",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => handleLectureSelect(lecture)}
                          >
                            <span
                              {...providedDrag.dragHandleProps}
                              style={{ marginRight: 10, cursor: "grab" }}
                            >
                              <TbGripVertical size={18} />
                            </span>
                            <span style={{ fontSize: "14px", flex: 1 }}>
                              {lecture.title}
                            </span>
                            {isSelected && (
                              <>
                                <Button
                                  size="sm"
                                  variant="light"
                                  style={{
                                    marginLeft: 8,
                                    color: "#fff",
                                    background: "#4285f4",
                                    border: "1px solid #fff",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditLecture(lecture);
                                  }}
                                >
                                  <FaPencilAlt />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  style={{
                                    marginLeft: 8,
                                    color: "#fff",
                                    background: "#dc3545",
                                    border: "1px solid #fff",
                                  }}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Are you sure you want to delete this lecture?")) {
                                      try {
                                        await useAxios().delete(`/teacher/lecture/${lecture.id}/`);
                                        Toast().fire({ icon: "success", title: "Lecture deleted" });
                                        fetchLectures(selectedCourse.id);
                                        setSelectedLecture(null);
                                      } catch {
                                        Toast().fire({ icon: "error", title: "Failed to delete lecture." });
                                      }
                                    }
                                  }}
                                >
                                  <FaTrash />
                                </Button>
                              </>
                            )}
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          {lectures.length === 0 && (
            <div style={{ padding: 24, textAlign: "center" }}>
              <p>No lectures yet for this course.</p>
              <Button variant="primary" onClick={handleAddLecture}>
                <FaPlus /> Add Lecture
              </Button>
            </div>
          )}
        </div>
      </div>
    )}

    <Modal
      show={showEditLectureModal}
      onHide={() => setShowEditLectureModal(false)}
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {editingLecture ? "Edit Lecture" : "Add Lecture"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append("title", e.target.title.value);
            formData.append("description", e.target.description.value);
            if (e.target.video.files[0]) {
              formData.append("video", e.target.video.files[0]);
            }
            try {
              if (editingLecture) {
                // Edit mode: update lecture
                await useAxios().put(
                  `/teacher/lecture/${editingLecture.id}/`,
                  formData,
                  {
                    headers: { "Content-Type": "multipart/form-data" },
                  }
                );
              } else {
               
                await useAxios().post(
                  `/teacher/course/${selectedCourse.id}/lecture-create/`,
                  formData,
                  {
                    headers: { "Content-Type": "multipart/form-data" },
                  }
                );
              }
              setShowEditLectureModal(false);
              fetchLectures(selectedCourse.id);
            } catch {
              Toast().fire({
                icon: "error",
                title: editingLecture
                  ? "Failed to save lecture."
                  : "Failed to add lecture.",
              });
            }
          }}
        >
          <Form.Group className="mb-3">
            <Form.Label>Lecture Title</Form.Label>
            <Form.Control
              type="text"
              defaultValue={editingLecture?.title || ""}
              name="title"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              defaultValue={editingLecture?.description || ""}
              name="description"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Video File</Form.Label>
            <Form.Control type="file" accept="video/*" name="video" />
            {editingLecture?.video && (
              <div className="mt-2" style={{ fontSize: "0.95em" }}>
                <strong>Current Video:</strong>{" "}
                {editingLecture.video.split("/").pop()}
              </div>
            )}
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => setShowEditLectureModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingLecture ? "Save" : "Add"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
    <Modal
      show={showAddResourceModal || showEditResourceModal}
      onHide={() => {
        setShowAddResourceModal(false);
        setShowEditResourceModal(false);
        setEditingResource(null);
      }}
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {editingResource ? "Edit Resource" : "Add Resource"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append("title", e.target.title.value);
            if (e.target.resource_file.files[0]) {
              formData.append("file", e.target.resource_file.files[0]);
            }
            try {
              if (editingResource) {
                // Edit mode: update resource
                await useAxios().put(
                  `teacher/course/${selectedCourse.id}/${selectedLecture.id}/resources/${editingResource.id}/`,
                  formData,
                  {
                    headers: { "Content-Type": "multipart/form-data" },
                  }
                );
              } else {
                // Add mode: create resource
                await useAxios().post(
                  `teacher/course/${selectedCourse.id}/${selectedLecture.id}/resources/${editingResource.id}/`,
                  formData,

                  {
                    headers: { "Content-Type": "multipart/form-data" },
                  }
                );
              }
              setShowAddResourceModal(false);
              setShowEditResourceModal(false);
              setEditingResource(null);
              fetchLectureResources(selectedCourse.id, selectedLecture.id);
            } catch {
              Toast().fire({
                icon: "error",
                title: editingResource
                  ? "Failed to update resource."
                  : "Failed to add resource.",
              });
            }
          }}
        >
          <Form.Group className="mb-3">
            <Form.Label>Resource Name</Form.Label>
            <Form.Control
              type="text"
              name="title"
              defaultValue={editingResource?.title || ""}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Resource File</Form.Label>
            <Form.Control type="file" name="resource_file" />
            {editingResource?.file_url && (
              <div className="mt-2" style={{ fontSize: "0.95em" }}>
                <strong>Current File:</strong>{" "}
                <a href={editingResource.file_url} target="_blank" rel="noopener noreferrer">
                  {editingResource.file_url.split("/").pop()}
                </a>
              </div>
            )}
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => {
                setShowAddResourceModal(false);
                setShowEditResourceModal(false);
                setEditingResource(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingResource ? "Save" : "Add"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
    <style>
    {`
.video-js.vjs-youtube-style .vjs-volume-panel {
  display: flex;
  align-items: center;
  margin-right: 0;
}

.video-js.vjs-youtube-style .vjs-volume-control {
  width: 0;
  transition: width 0.2s;
  height: 100%;
  backgroundcolor: rgba(0, 0, 0, 0)!important;
}

.video-js.vjs-youtube-style .vjs-volume-panel:hover .vjs-volume-control,
.video-js.vjs-youtube-style .vjs-volume-panel:focus .vjs-volume-control,
.video-js.vjs-youtube-style .vjs-volume-panel.vjs-hover .vjs-volume-control {
  visibility: visible;
  opacity: 1;
  width: 50px;
  height: 100%;
  backgroundcolor: rgba(0, 0, 0, 0)!important;
}

.video-js.vjs-youtube-style .vjs-volume-level {
  background-color: white;
  height: 100%;
}

.video-js.vjs-youtube-style .vjs-volume-panel {
  display: flex;
  align-items: center;
  margin-right: 0;
}

.video-js.vjs-youtube-style .vjs-volume-control {
  width: 0;
  transition: width 0.2s;
  height: 100%;
  display: flex;
  align-items: center;
  margin-top:0.7px; 
}

.video-js.vjs-youtube-style .vjs-volume-bar {
  margin: 0 auto;
  height: 3px;
}

.video-js.vjs-youtube-style .vjs-volume-panel:hover .vjs-volume-control,
.video-js.vjs-youtube-style .vjs-volume-panel:focus .vjs-volume-control,
.video-js.vjs-youtube-style .vjs-volume-panel.vjs-hover .vjs-volume-control {
  visibility: visible;
  opacity: 1;
  width: 50px;
  height: 100%;
}  .dark-mode .modal-content {
    background-color: #222 !important;
    color: #fff !important;
  }
  .dark-mode .modal-content .form-control,
  .dark-mode .modal-content .form-select,
  .dark-mode .modal-content input,
  .dark-mode .modal-content textarea,
  .dark-mode .modal-content select {
    background-color: #fff !important;
    color: #222 !important;
    border-color: #bbb !important;
  }

.swal2-container, /* For SweetAlert2 */
.toast-container, /* For react-toastify */
#toast-container, /* For some other libraries */
.custom-toast-container { /* For your own Toast */
  z-index: 3000 !important;
}
`}
</style>
  </div>
);
};

export default InstructorCourses;

