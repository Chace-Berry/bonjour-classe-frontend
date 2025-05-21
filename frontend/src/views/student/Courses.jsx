import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Badge, Form, Button, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import Cookies from "js-cookie";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Sidebar from "./Partials/Sidebar";
import Header from "../instructor/Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import QuizModal from "./Partials/CourseQuizModal";
import CertificateModal from "./Partials/CertificateModal";
import { IMG_BASE_URL } from "../../utils/constants";
import MobileNav from "./Partials/Mobile_Nav";

const normalizeVideoUrl = (url) => {
  if (!url) return url;
  let fixed = url;
  // console.log(`Normalized video URL: ${url} → ${fixed}`);
  return fixed;
};


let youtubeStylesAdded = false;
const applyYouTubeStyle = (player) => {
  if (!player || player.isDisposed()) {
    // console.warn("applyYouTubeStyle called on null or disposed player.");
    return;
  }
  // console.log("Applying YouTube style to player.");
  player.addClass('vjs-youtube-style');
  const generateRandomColor = () => {
    const colors = ["#8c0101", "#034287"];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  const progressColor = generateRandomColor();
  if (!youtubeStylesAdded) {
    const styleId = 'vjs-youtube-global-styles';
    if (!document.getElementById(styleId)) {
      const globalStyle = document.createElement('style');
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
        
        /* Mobile touch improvements */
        .video-js .vjs-tech {
          cursor: pointer;
        }
        
        @media (max-width: 700px) {
          .video-js .vjs-control-bar {
            height: 50px; /* Larger on mobile for easier touch */
          }
          
          .video-js .vjs-button > .vjs-icon-placeholder:before {
            font-size: 24px; /* Larger icons on mobile */
            line-height: 50px;
          }
          
          /* Larger progress bar for mobile */
          .video-js .vjs-progress-control {
            height: 5px !important;
          }
          
          .video-js:hover .vjs-progress-control {
            height: 8px !important;
          }
          
          /* Ensure touch targets are large enough */
          .video-js .vjs-control {
            width: 40px;
          }
          
          .video-js .vjs-play-progress:before {
            font-size: 12px;
            top: -5px;
          }
        }
      `;
      document.head.appendChild(globalStyle);
      youtubeStylesAdded = true;
      // console.log("Added global YouTube styles.");
    }
  }

  player.ready(() => {

    setTimeout(() => {
      const progressControl = player.el().querySelector('.vjs-progress-control');
      if (progressControl) {
        progressControl.style.width = '100%';
        
        const progressHolder = player.el().querySelector('.vjs-progress-holder');
        if (progressHolder) {
          progressHolder.style.width = '100%';
        }
      }
    }, 100);

    const settingsButton = document.createElement('button');
    settingsButton.className = 'vjs-control vjs-button vjs-youtube-settings-button';
    settingsButton.type = 'button';
    settingsButton.title = 'Settings';
    
    const iconPlaceholder = document.createElement('span');
    iconPlaceholder.className = 'vjs-icon-placeholder';
    settingsButton.appendChild(iconPlaceholder);

    const speedMenu = document.createElement('div');
    speedMenu.className = 'vjs-speed-menu';
    
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    speeds.forEach(speed => {
      const menuItem = document.createElement('div');
      menuItem.className = 'vjs-speed-menu-item';
      menuItem.textContent = speed === 1 ? 'Normal' : `${speed}×`;
      menuItem.dataset.speed = speed;
      
      if (player.playbackRate() === speed) {
        menuItem.classList.add('selected');
      }
      
      menuItem.addEventListener('click', () => {
        player.playbackRate(speed);
        
        document.querySelectorAll('.vjs-speed-menu-item').forEach(item => {
          item.classList.remove('selected');
        });
        menuItem.classList.add('selected');
        
        speedMenu.classList.remove('active');
      });
      
      speedMenu.appendChild(menuItem);
    });
    
settingsButton.addEventListener('click', (e) => {
  e.stopPropagation();
  speedMenu.classList.toggle('active');
});

const closeMenuHandler = (e) => {
      if (!speedMenu.contains(e.target) && !settingsButton.contains(e.target)) {
        speedMenu.classList.remove('active');
      }
    };
    
    document.addEventListener('click', closeMenuHandler);
    player.closeMenuHandler_ = closeMenuHandler; 
    const controlBar = player.getChild('controlBar').el();
    const leftControls = document.createElement('div');
    leftControls.className = 'vjs-youtube-left-controls';
    const rightControls = document.createElement('div');
    rightControls.className = 'vjs-youtube-right-controls';
    const playToggle = controlBar.querySelector('.vjs-play-control');
    const volumePanel = controlBar.querySelector('.vjs-volume-panel');
    const currentTime = controlBar.querySelector('.vjs-current-time');
    const timeDivider = controlBar.querySelector('.vjs-time-divider');
    const durationDisplay = controlBar.querySelector('.vjs-duration');
    const progressControl = controlBar.querySelector('.vjs-progress-control');
    const fullscreenToggle = controlBar.querySelector('.vjs-fullscreen-control');
    const pictureInPicture = controlBar.querySelector('.vjs-picture-in-picture-control');
    
    
    Array.from(controlBar.children).forEach(child => {
      if (child !== progressControl && !leftControls.contains(child) && !rightControls.contains(child)) {
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
}

function Courses() {
  const [courses, setCourses] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loadingScreen, setLoadingScreen] = useState(true); 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showLecturePopup, setShowLecturePopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
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
  const [cartId, setCartId] = useState(localStorage.getItem('cart_id') || null);
  const [activeTab, setActiveTab] = useState('description'); 
  const [lectureResources, setLectureResources] = useState([]); 
  const [loadingResources, setLoadingResources] = useState(false); 
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [courseProgress, setCourseProgress] = useState({});
  const [lectureProgress, setLectureProgress] = useState({});
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [linkedQuizId, setLinkedQuizId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateCourseId, setCertificateCourseId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    }, []);
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const progressUpdateTimeoutRef = useRef(null);
  const videoContainerRef = useRef(null);
  const currentLectureRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const fetchData = async () => {
    try {
      setFetching(true);
      const response = await useAxios().get(
        `student/course-list/${UserData()?.user_id}/`
      );
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

  const getLevelColor = (level) => {
    switch(level) {
      case 'Beginner': return '#28a745'; // green
      case 'Intermediate': return '#007bff'; // blue
      case 'Advanced': return '#dc3545'; // red
      default: return '#6c757d'; // gray
    }
  };

  const fetchLectures = async (courseId) => {
    try {
      const response = await useAxios().get(`/course/${courseId}/lectures/`);
      setLectures(response.data);
    } catch (error) {
      // console.error("Error fetching lectures:", error);
    }
  };
// Add this near your other fetch functions
const fetchAllLectureProgress = async (courseId) => {
  try {
    const response = await useAxios().get(`/course/${courseId}/progress/`);
    // response.data.lectures is an array of { lecture_id, percentage_complete, completed, current_time }
    if (response.data && Array.isArray(response.data.lectures)) {
      const progressMap = {};
      response.data.lectures.forEach(item => {
        progressMap[item.lecture_id] = {
          percentage: item.percentage_complete || 0,
          completed: item.completed || false,
          current_time: item.current_time || 0
        };
      });
      setLectureProgress(progressMap);
    }
  } catch (error) {
    // console.error("Error fetching all lecture progress:", error);
  }
};
  const openLecturePopup = async (course) => {
    setSelectedCourse(course);
    await fetchLectures(course.id);
    await fetchAllLectureProgress(course.id); 
    setShowLecturePopup(true);
  };
  // Add this function to handle opening the certificate modal
const openCertificateModal = (course) => {
  setCertificateCourseId(course.course_id); // Or wherever the correct ID is stored
  setShowCertificateModal(true);
};

  const closeLecturePopup = () => {
    setShowLecturePopup(false);
    setSelectedCourse(null);
    setSelectedLecture(null);

    
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  };
// Replace the markVideoCompleted function with this improved version
const markVideoCompleted = async (lecture = null) => {
  // console.log("Video ended - markVideoCompleted triggered");
  
  // Use the provided lecture or fallback to current state/ref
  const lectureToMark = lecture || currentLectureRef.current || selectedLecture;
  
  if (!playerRef.current || !lectureToMark || !selectedCourse) {
    return;
  }
  
  try {
    const currentTime = playerRef.current.currentTime();
    const duration = playerRef.current.duration();
    // console.log(`Video completed - Time: ${currentTime}/${duration} for lecture ${lectureToMark.id}`);

    // 1. Save lecture progress (time)
    // console.log(`Saving progress for lecture ID: ${lectureToMark.id}`);
    await useAxios().post(`/lecture/${lectureToMark.id}/progress/`, {
      current_time: duration, // Use full duration to ensure 100%
      duration: duration
    });

    // 2. Mark lecture as completed
    // console.log(`Marking lecture as completed - Lecture: ${lectureToMark.id}, Course: ${selectedCourse.id}`);
    const completionResponse = await useAxios().post(
      `/student/track-lecture-completion/`,
      {
        lecture_id: lectureToMark.id,
        course_id: selectedCourse.id
      }
    );
    // console.log("Completion response:", completionResponse.data);

    // Update local state after completion
    setLectureProgress(prev => ({
      ...prev,
      [lectureToMark.id]: {
        ...prev[lectureToMark.id],
        percentage: 100,
        completed: true,
        current_time: duration
      }
    }));

    // Refresh progress data
    fetchLectureProgress(lectureToMark.id);
    fetchCourseProgress();
    
    // 3. Check for a linked quiz
    // console.log(`Checking for linked quiz for lecture: ${lectureToMark.id}`);
    try {
      const quizRes = await useAxios().get(`/lecture/${lectureToMark.id}/quiz/`);
      // console.log("Quiz check response:", quizRes.data);
      
      if (quizRes.data && quizRes.data.quiz_id) {
        // console.log(`Quiz found! Opening quiz ID: ${quizRes.data.quiz_id}`);
        setLinkedQuizId(quizRes.data.quiz_id);
        setShowQuizModal(true);
      }
    } catch (quizError) {
    }
  } catch (error) {
    if (error.response) {
    }
  }
};
// Add this effect to detect when a course reaches 100% completion
useEffect(() => {
  // Check if any course just reached 100%
  Object.entries(courseProgress).forEach(([courseId, progress]) => {
    if (progress && progress.percentage >= 100) {
      const course = courses.find(c => c.course.id === parseInt(courseId));
      if (course) {
        // Check if this is a newly completed course by looking at local storage
        const completedCourses = JSON.parse(localStorage.getItem('completedCourses') || '[]');
        if (!completedCourses.includes(parseInt(courseId))) {
          // Add to completed courses
          completedCourses.push(parseInt(courseId));
          localStorage.setItem('completedCourses', JSON.stringify(completedCourses));
          // Open certificate modal
          openCertificateModal(parseInt(courseId));
        }
      }
    }
  });
}, [courseProgress, courses]);
// Add this function to handle filtering based on all criteria
const filteredCourses = () => {
  let filtered = [...courses];
  
  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(c => 
      c.course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Filter by category
  if (selectedCategory && selectedCategory !== "all") {
    filtered = filtered.filter(c => c.course.level === selectedCategory);
  }
  
  // Filter by status
  if (statusFilter === "completed") {
    filtered = filtered.filter(c => {
      const progress = courseProgress[c.course.id] || { percentage: 0 };
      return progress.percentage >= 100;
    });
  } else if (statusFilter === "in_progress") {
    filtered = filtered.filter(c => {
      const progress = courseProgress[c.course.id] || { percentage: 0 };
      return progress.percentage > 0 && progress.percentage < 100;
    });
  }
  
  // Sort filtered courses
  filtered.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === "oldest") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === "title_asc") {
      return a.course.title.localeCompare(b.course.title);
    } else if (sortBy === "title_desc") {
      return b.course.title.localeCompare(a.course.title);
    }
    return 0;
  });
  
  return filtered;
};

// Attach this handler to the video.js player after initializing the player:
useEffect(() => {
if (!playerRef.current) return;
playerRef.current.on('ended', markVideoCompleted);
return () => {
  if (playerRef.current) {
    playerRef.current.off('ended', markVideoCompleted);
  }
};
}, [selectedLecture, selectedCourse]);
  const fetchLectureResources = async (courseId, lectureId) => {
    try {
      setLoadingResources(true);
      const response = await useAxios().get(`/course/${courseId}/lecture/${lectureId}/resources/`);
      
      // Log the response to inspect file sizes
      // console.log("Resources response:", response.data);
      
      // Make sure resources have proper file size information
      const resourcesWithSize = response.data.map(resource => {
        // Ensure file_size is a number if available
        if (resource.file_size && !isNaN(parseFloat(resource.file_size))) {
          resource.file_size = parseFloat(resource.file_size);
        }
        return resource;
      });
      
      setLectureResources(resourcesWithSize);
    } catch (error) {
      // console.error("Error fetching lecture resources:", error);
      setLectureResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

const handleLectureSelect = async (lecture) => {
  if (!lecture || !selectedCourse) return;
  if (selectedLecture?.id === lecture.id && playerRef.current) return;

  setIsVideoLoading(true);
  // Store the selected lecture in state and in ref for event handlers
  setSelectedLecture(lecture);
  // Update the ref immediately to ensure event handlers use the correct ID
  currentLectureRef.current = lecture;

  try {
    // --- 1. Fetch Data ---
    // console.log(`Fetching data for lecture ID: ${lecture.id}`);

    // --- Get Axios instance ---
    let axiosInstance;
    try {
        axiosInstance = useAxios(); // Get the configured Axios instance
        if (!axiosInstance) {
            // console.error("useAxios() returned null or undefined!");
            throw new Error("Axios instance is not available.");
        }
        // console.log("useAxios() instance obtained:", axiosInstance);
    } catch (axiosError) {
        // console.error("Error obtaining Axios instance:", axiosError);
        setIsVideoLoading(false);
        // Optionally show a user-facing error message here
        return; // Stop execution if Axios isn't available
    }
    // --- End Get ---

    // --- Initial tracking when lecture is first opened ---
    try {
      // console.log(`Recording initial view for lecture ID: ${lecture.id}`);
      // Track that user has started viewing this lecture
      await axiosInstance.post(`/lecture/${lecture.id}/progress/`, {
        current_time: 0, // Starting at the beginning
        duration: 0 // Will be updated when metadata loads
      });
    } catch (trackingError) {
      // console.error("Error recording initial lecture view:", trackingError);
      // Continue execution even if tracking fails
    }

    // Rest of existing code...
    const [progressResponse, videoResponse, resources] = await Promise.all([
        axiosInstance.get(`/lecture/${lecture.id}/progress/`).catch(err => {
            // console.error("Progress fetch error:", err);
            // console.error("Progress fetch error response:", err.response);
            return { data: null }; // Ensure Promise.all doesn't reject immediately
        }),
        axiosInstance.get(`/lecture/${lecture.id}/video-metadata/`).catch(err => {
            // console.error("Metadata fetch error:", err);
            // console.error("Metadata fetch error response:", err.response);
            return { data: null }; // Ensure Promise.all doesn't reject immediately
        }),
        fetchLectureResources(selectedCourse.id, lecture.id) // Assuming this also uses useAxios internally or is handled
    ]);

    // Log the raw videoResponse object
    // console.log("Raw videoResponse:", videoResponse);
    // Log the data part of the response
    // console.log("videoResponse.data:", videoResponse?.data);
    // Log the URL specifically
    // console.log("videoResponse.data.url:", videoResponse?.data?.url);

    // ... (update progress state based on progressResponse) ...
    if (progressResponse?.data) {
      setVideoCurrentTime(progressResponse.data.current_time || 0);
      setVideoDuration(progressResponse.data.duration || 0);
      setLectureProgress(prev => ({
        ...prev,
        [lecture.id]: {
          percentage: progressResponse.data.percentage_complete || 0,
          completed: progressResponse.data.completed || false,
          current_time: progressResponse.data.current_time || 0
        }
      }));
    }


    // --- 2. Dispose Existing Player ---
    const disposePlayer = () => {
      return new Promise((resolve) => {
        if (playerRef.current) {
          // console.log("Disposing existing player instance.");
          try {
            // Remove specific listener if added (handled in useEffect)
            playerRef.current.dispose(); // Dispose should handle DOM removal
          } catch (e) {
            // console.error("Error disposing player:", e);
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
        // console.error("Video container ref is not available after delay.");
        setIsVideoLoading(false);
        return;
      }

      // Check if container is empty (optional, dispose should handle it)
      if (container.firstChild) {
          // console.warn("Container was not empty after player disposal. Video.js dispose might not have fully cleaned up.");
          // Avoid manual clearing here to prevent conflicts
      }

      // console.log("Creating new video element.");
      const newVideoElement = document.createElement('video');
      // ... (set attributes and styles for newVideoElement) ...
      newVideoElement.className = 'video-js vjs-default-skin';
      newVideoElement.setAttribute('controls', 'true');
      newVideoElement.setAttribute('preload', 'auto');
      newVideoElement.style.width = '100%';
      newVideoElement.style.height = '100%';

      // Append the new element
      container.appendChild(newVideoElement);
      videoRef.current = newVideoElement; 


      if (!videoResponse?.data?.url) {
        // console.error("Video URL is missing or invalid in videoResponse.data:", videoResponse?.data);
        
        if(videoRef.current && videoRef.current.parentNode === container) {
            container.removeChild(videoRef.current);
        }
        videoRef.current = null;
        setIsVideoLoading(false);
        return;
      }

      const videoJsOptions = { /* ... */ };

      try {
        // console.log("Initializing new video.js player.");
        playerRef.current = videojs(videoRef.current, videoJsOptions);

        playerRef.current.ready(() => {
          if (!playerRef.current || playerRef.current.isDisposed()) { /* ... */ return; }
          // console.log("Player is ready.");

          let videoSrc = videoResponse.data.url;
          const videoType = videoResponse.data.mime_type || 'video/mp4';
          // --- FIX: Construct full URL correctly ---
          if (videoSrc && videoSrc.startsWith('/')) {
            const baseURL = axiosInstance.defaults.baseURL || 'https://127.0.0.1:8000'; // Use baseURL from the instance
            const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const cleanVideoSrcPath = videoSrc.startsWith('/') ? videoSrc.slice(1) : videoSrc;
            videoSrc = `${cleanBaseURL}/${cleanVideoSrcPath}`;
            // console.log(`Constructed full video URL: ${videoSrc}`);
          } else if (videoSrc && !videoSrc.startsWith('http')) {
            const baseURL = axiosInstance.defaults.baseURL || 'https://127.0.0.1:8000'; // Use baseURL from the instance
            const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            videoSrc = `${cleanBaseURL}/${videoSrc}`;
            // console.log(`Constructed full video URL (no leading slash case): ${videoSrc}`);
          }
          videoSrc = videoSrc.replace(/\\/g, '/');
          // console.log(`Setting video source: ${videoSrc} (${videoType})`);
          playerRef.current.src({ src: videoSrc, type: videoType });
          playerRef.current.on('timeupdate', handleTimeUpdate);
          playerRef.current.on('loadedmetadata', handleVideoLoaded);
          playerRef.current.on('ended', () => {
            // Use the ref to ensure we have the current lecture ID
            if (currentLectureRef.current) {
              // console.log(`Video ended for lecture: ${currentLectureRef.current.id}`);
              markVideoCompleted(currentLectureRef.current);
            } else {
              // console.error("Video ended but no current lecture reference");
            }
          });
          playerRef.current.on('error', () => { /* ... error handling ... */ setIsVideoLoading(false); });
          playerRef.current.on('loadeddata', () => { /* console.log("Video data loaded."); */ setIsVideoLoading(false); });
          playerRef.current.on('canplay', () => { /* console.log("Video can play."); */ });

          setupMobileControls(playerRef.current);
          applyYouTubeStyle(playerRef.current);

          // Use progressResponse data for start time
          const startTime = progressResponse?.data?.current_time;
          if (startTime && startTime > 0) {
            // console.log(`Setting current time to: ${startTime}`);
            playerRef.current.currentTime(startTime);
          }
          if (isVideoLoading) setIsVideoLoading(false);
        });

        // When the metadata is loaded, update the progress with accurate duration
        playerRef.current.on('loadedmetadata', () => {
          if (currentLectureRef.current && currentLectureRef.current.id === lecture.id) {
            const duration = playerRef.current.duration();
            if (duration && !isNaN(duration)) {
              // Update with accurate duration once available
              axiosInstance.post(`/lecture/${lecture.id}/progress/`, {
                current_time: 0,
                duration: duration
              }).catch(() => {});
            }
          }
        });

      } catch (initError) {
        // console.error("Error initializing video.js player:", initError);
         // Clean up the newly added video element on init error
        if(videoRef.current && videoRef.current.parentNode === container) {
            container.removeChild(videoRef.current);
        }
        videoRef.current = null;
        setIsVideoLoading(false);
      }
    }, 100); // Delay in milliseconds (adjust if needed)

  } catch (error) {
    // console.error("Error in handleLectureSelect:", error);
    // Toast.fire({ icon: "error", title: "Failed to load lecture video." }); // Ensure Toast is available
    setIsVideoLoading(false);
  }
};

const handleVideoLoaded = () => {
  try {
    if (!playerRef.current || !selectedLecture) return;
    
    const duration = playerRef.current.duration();
    if (isNaN(duration) || duration <= 0) return;
    
    // console.log(`Video loaded: ${selectedLecture.title}, duration: ${formatTime(duration)}`);
    
    
    setVideoDuration(duration);
    
    
    if (videoCurrentTime > 0 && videoCurrentTime < duration) {
      // console.log(`Restoring playback position to ${videoCurrentTime}s`);
      playerRef.current.currentTime(videoCurrentTime);
    }
    
    
    if (selectedLecture.chapters && selectedLecture.chapters.length) {
      addChapterMarkers(playerRef.current, selectedLecture);
    }
    
    
    enhanceScrubbing(playerRef.current);
  } catch (error) {
    // console.error("Error in handleVideoLoaded:", error);
  }
};

const handleVideoEnded = async () => {
  
  if (!selectedLecture) return;
  
  
  try {
    const currentTime = playerRef.current.currentTime();
    const duration = playerRef.current.duration();
    
    
    if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
      // console.log("Invalid video times, not saving progress");
      return;
    }
    
    const response = await useAxios().post(`/lecture/${selectedLecture.id}/progress/`, {
      current_time: currentTime,
      duration: duration
    });
    
    
    if (response.data) {
      const wasCompleted = lectureProgress[selectedLecture.id]?.completed || false;
      const isNowCompleted = response.data.completed || false;
      
      setLectureProgress(prev => ({
        ...prev,
        [selectedLecture.id]: {
          percentage: response.data.percentage_complete || 0,
          completed: response.data.completed || false,
          current_time: response.data.current_time || 0
        }
      }));
      
      
      if (!wasCompleted && isNowCompleted) {
        fetchCourseProgress();
      }
    }
  } catch (error) {
    // console.error("Error saving video progress:", error);
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
    
    
    // console.log(`Video time: ${formattedCurrentTime} / ${formattedDuration}`);
    
    
    setVideoCurrentTime(currentTime);
    
    
    const percentage = Math.round((currentTime / duration) * 100);
    
    
    setLectureProgress(prev => ({
      ...prev,
      [selectedLecture.id]: {
        ...prev[selectedLecture.id],
        percentage: percentage,
        current_time: currentTime
      }
    }));
    
    
    
    const lastSaveTime = playerRef.current.lastProgressSave || 0;
    if (currentTime - lastSaveTime >= 10) {
      saveVideoProgress();
      playerRef.current.lastProgressSave = currentTime;
    }
  } catch (error) {
    // console.error("Error in handleTimeUpdate:", error);
  }
};

const saveVideoProgress = async () => {
  if (!playerRef.current || !selectedLecture) return;
  
  try {
    const currentTime = playerRef.current.currentTime();
    const duration = playerRef.current.duration();
    
    
    if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
      // console.log("Invalid video times, not saving progress");
      return;
    }
    
    
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
    
    
    progressUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        // console.log(`Saving progress: lecture=${selectedLecture.id}, time=${currentTime.toFixed(2)}/${duration.toFixed(2)}`);
        const response = await useAxios().post(`/lecture/${selectedLecture.id}/progress/`, {
          current_time: currentTime,
          duration: duration
        });
        
        
        if (response.data) {
          const wasCompleted = lectureProgress[selectedLecture.id]?.completed || false;
          const isNowCompleted = response.data.completed || false;
          
          setLectureProgress(prev => ({
            ...prev,
            [selectedLecture.id]: {
              percentage: response.data.percentage_complete || 0,
              completed: response.data.completed || false,
              current_time: response.data.current_time || 0
            }
          }));
          
          
          if (!wasCompleted && isNowCompleted) {
            fetchCourseProgress();
          }
        }
      } catch (error) {
        // console.error("Error saving video progress:", error);
      }
    }, 1000); 
  } catch (error) {
    // console.error("Error in saveVideoProgress:", error);
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
      // console.log("Disposing player on component unmount.");
      try {
        
        if (playerRef.current.closeMenuHandler_) {
            document.removeEventListener('click', playerRef.current.closeMenuHandler_);
            // console.log("Removed speed menu close handler.");
        }
        playerRef.current.dispose();
      } catch (e) {
        // console.error("Error disposing player on unmount:", e);
      } finally {
        playerRef.current = null;
      }
    }
  };
}, []); 


const enhanceScrubbing = (player) => {
  if (!player) return;
  
  player.ready(() => {
    // console.log("Setting up enhanced video scrubbing with keyframe simulation");
    
    
    const videoEl = player.tech().el_;
    videoEl.preload = 'auto'; 
    
    
    const createVirtualKeyframes = (duration) => {
      if (!duration || isNaN(duration) || duration <= 0) return null;
      
      
      const keyframeInterval = 2;
      const keyframes = [];
      
      // console.log(`Creating virtual keyframes for video with duration ${formatTime(duration)}:`);
      // console.log(`Using keyframe interval: ${keyframeInterval} seconds`);
      
      
      const keyframeInfo = [];
      
      for (let time = 0; time <= duration; time += keyframeInterval) {
        const position = time / duration;
        
        
        keyframes.push({
          time: time,
          position: position
        });
        
        
        keyframeInfo.push({
          index: keyframes.length - 1,
          time: time.toFixed(2) + 's',
          position: (position * 100).toFixed(2) + '%',
          formatTime: formatTime(time)
        });
      }
      
      
      // console.log(`Created ${keyframes.length} virtual keyframes for ${formatTime(duration)} video`);
      // console.table(keyframeInfo); 
      
      
      if (keyframes.length > 0) {
        // console.log(`First keyframe: ${keyframes[0].time.toFixed(2)}s (${(keyframes[0].position * 100).toFixed(2)}%)`);
        
        
        if (keyframes.length >= 3) {
          const midIndex = Math.floor(keyframes.length / 2);
          // console.log(`Middle keyframe: ${keyframes[midIndex].time.toFixed(2)}s (${(keyframes[midIndex].position * 100).toFixed(2)}%)`);
        }
        
        
        const lastIndex = keyframes.length - 1;
        // console.log(`Last keyframe: ${keyframes[lastIndex].time.toFixed(2)}s (${(keyframes[lastIndex].position * 100).toFixed(2)}%)`);
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
    
    player.on('loadedmetadata', () => {
      const duration = player.duration();
      if (duration && duration > 0) {
        virtualKeyframes = createVirtualKeyframes(duration);
      }
    });
    
    
    player.on('seeking', () => {
      // console.log(`Seeking started at: ${player.currentTime().toFixed(2)}s`);
      player.addClass('vjs-seeking');
    });
    
    player.on('seeked', () => {
      // console.log(`Seeking completed at: ${player.currentTime().toFixed(2)}s`);
      player.removeClass('vjs-seeking');
      
      
      setVideoCurrentTime(player.currentTime());
    });
    
    
    const progressHolder = player.el().querySelector('.vjs-progress-holder');
    if (!progressHolder) {
      // console.error("Progress holder not found");
      return;
    }
    
    
    const handleProgressClick = function(event) {
      
      event.preventDefault();
      event.stopPropagation();
      
      
      const rect = progressHolder.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      
      
      const duration = player.duration();
      
      if (isNaN(duration) || duration <= 0) {
        // console.error("Invalid video duration:", duration);
        return false;
      }
      
      
      let newTime = percentage * duration;
      
      
      if (virtualKeyframes) {
        const closestKeyframe = findClosestKeyframe(virtualKeyframes, newTime);
        if (closestKeyframe) {
          
          const diff = Math.abs(newTime - closestKeyframe.time);
          if (diff < 0.5) {
            // console.log(`Snapping to nearby keyframe at ${closestKeyframe.time.toFixed(2)}s`);
            newTime = closestKeyframe.time;
          }
        }
      }
      
      // console.log(`Seeking to ${newTime.toFixed(2)}s (${(percentage * 100).toFixed(1)}%)`);
      
      try {
        
        player.addClass('vjs-seeking');
        
        
        setVideoCurrentTime(newTime);
        
        
        
        const wasPlaying = !player.paused();
        if (wasPlaying) player.pause();
        
        
        videoEl.currentTime = newTime;
        
        
        player.currentTime(newTime);
        
        
        const seekedHandler = function() {
          if (wasPlaying) player.play();
          player.off('seeked', seekedHandler);
        };
        
        player.on('seeked', seekedHandler);
        
        
        setTimeout(() => {
          saveVideoProgress();
        }, 500);
      } catch (error) {
        // console.error("Error during seek operation:", error);
        player.removeClass('vjs-seeking');
      }
      
      return false;
    };
    
    
    progressHolder.onclick = null;
    if (progressHolder._clickHandler) {
      progressHolder.removeEventListener('click', progressHolder._clickHandler);
    }
    
    
    progressHolder._clickHandler = handleProgressClick;
    progressHolder.addEventListener('click', handleProgressClick);
    
    
    const enhanceBufferDisplay = () => {
      const updateBufferDisplay = () => {
        try {
          
          const buffered = player.buffered();
          const duration = player.duration();
          
          if (!buffered || !duration) return;
          
          
          const bufferBar = player.el().querySelector('.vjs-load-progress');
          if (!bufferBar) return;
          
          
          bufferBar.innerHTML = '';
          
          for (let i = 0; i < buffered.length; i++) {
            const start = buffered.start(i) / duration * 100;
            const width = (buffered.end(i) - buffered.start(i)) / duration * 100;
            
            const div = document.createElement('div');
            div.className = 'vjs-load-progress-segment';
            div.style.left = start + '%';
            div.style.width = width + '%';
            bufferBar.appendChild(div);
          }
        } catch (e) {
          // console.error("Error updating buffer display:", e);
        }
      };
      
      
      player.on('progress', updateBufferDisplay);
    };
    
    
    const style = document.createElement('style');
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
    
    // console.log("Enhanced seek handler with virtual keyframes installed successfully");
  });
};


const formatTime = (seconds) => {
  
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  
  
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};


const addChapterMarkers = (player, lecture) => {
  if (!player || !lecture.chapters || !lecture.chapters.length) return;
  
  player.ready(() => {
    const duration = player.duration();
    if (!duration) return;
    
    
    let markersContainer = player.el().querySelector('.vjs-chapter-markers');
    if (!markersContainer) {
      markersContainer = document.createElement('div');
      markersContainer.className = 'vjs-chapter-markers';
      markersContainer.style.position = 'absolute';
      markersContainer.style.bottom = '34px';
      markersContainer.style.width = '100%';
      markersContainer.style.height = '3px';
      markersContainer.style.pointerEvents = 'none';
      
      const progressControl = player.el().querySelector('.vjs-progress-control');
      if (progressControl) {
        progressControl.appendChild(markersContainer);
      }
    }
    
    
    markersContainer.innerHTML = '';
    
    
    lecture.chapters.forEach(chapter => {
      const marker = document.createElement('div');
      marker.className = 'vjs-chapter-marker';
      marker.style.position = 'absolute';
      marker.style.height = '100%';
      marker.style.width = '2px';
      marker.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
      marker.style.left = `${(chapter.time / duration) * 100}%`;
      
      markersContainer.appendChild(marker);
    });
  });
};



const handleSeeking = () => {
  if (!playerRef.current || !selectedLecture) return;
  
  try {
    const currentTime = playerRef.current.currentTime();
    // console.log(`Seeking started at position: ${currentTime.toFixed(2)}s`);
    
    
    
  } catch (error) {
    // console.error("Error in handleSeeking:", error);
  }
};

const handleSeeked = () => {
  if (!playerRef.current || !selectedLecture) return;
  
  try {
    const currentTime = playerRef.current.currentTime();
    // console.log(`Seeking ended at position: ${currentTime.toFixed(2)}s`);
    
    
    setVideoCurrentTime(currentTime);
    
    
    
    setTimeout(() => saveVideoProgress(), 300);
  } catch (error) {
    // console.error("Error in handleSeeked:", error);
  }
};

const setupMobileControls = (player) => {
  if (!player) return;
  
  // console.log("Setting up mobile-friendly controls");
  
  // Variable to track control visibility state
  let controlsVisible = true;
  
  // Variable to store the timeout ID
  let controlsTimeout = null;
  
  // Function to hide controls
  const hideControls = () => {
    if (player.isDisposed()) return;
    
    player.addClass('vjs-controls-hidden');
    controlsVisible = false;
    
    // console.log("Controls hidden");
  };
  
  // Function to show controls
  const showControls = () => {
    if (player.isDisposed()) return;
    
    player.removeClass('vjs-controls-hidden');
    controlsVisible = true;
    
    // Reset the auto-hide timer
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    // Auto-hide after 15 seconds
    controlsTimeout = setTimeout(() => {
      hideControls();
    }, 15000);
    
    // console.log("Controls shown, will auto-hide in 15 seconds");
  };
  
  // Function to toggle controls
  const toggleControls = () => {
    if (controlsVisible) {
      hideControls();
    } else {
      showControls();
    }
  };
  
  // Add click handler to the video element
  player.on('click', (event) => {
    // Don't toggle if clicked on a control or if player is paused
    if (
      !event.target.classList.contains('vjs-tech') &&
      !event.target.classList.contains('vjs-poster')
    ) {
      return;
    }
    
    toggleControls();
  });
  
  // Show controls initially and start the auto-hide timer
  showControls();
  
  // Show controls when the video is paused
  player.on('pause', () => {
    showControls();
  });
  
  // Reset timer when user interacts with controls
  player.on('useractive', () => {
    showControls();
  });
  
  // Add touch events for mobile devices
  const videoElement = player.el().querySelector('.vjs-tech');
  if (videoElement) {
    videoElement.addEventListener('touchstart', () => {
      toggleControls();
    });
  }
  
  // Add CSS for hiding controls
  const style = document.createElement('style');
  style.textContent = `
    .video-js.vjs-controls-hidden .vjs-control-bar {
      opacity: 0 !important;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    
    .video-js:not(.vjs-controls-hidden) .vjs-control-bar {
      opacity: 1 !important;
      pointer-events: auto;
      transition: opacity 0.3s ease;
    }
  `;
  document.head.appendChild(style);
};

  const downloadResource = (resource) => {
  
  const link = document.createElement('a');
  
  fetch(resource.file_url)
    .then(response => response.blob())
    .then(blob => {
      
      const blobUrl = window.URL.createObjectURL(blob);
      
      
      link.href = blobUrl;
      link.download = resource.title + (resource.file_type ? '.' + resource.file_type : '');
      link.target = '_self';
      
      
      document.body.appendChild(link);
      link.click();
      
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    })
    .catch(error => {
      // console.error("Download failed:", error);
      Toast().fire({
        icon: "error",
        title: "Download failed. Please try again."
      });
    });
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

    return () => clearTimeout(timer); 
  }, []);

  useEffect(() => {
    
    const savedCart = localStorage.getItem('user_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        
        
        const total = parsedCart.reduce((sum, item) => {
          const price = typeof item.price === 'string' 
            ? parseFloat(item.price) 
            : item.price;
          return sum + (isNaN(price) ? 0 : price);
        }, 0);
        
        setOrderTotal(total);
      } catch (e) {
        // console.error("Error parsing cart from localStorage:", e);
      }
    }
    
    
    const savedCartId = localStorage.getItem('cart_id');
    if (savedCartId) {
      setCartId(savedCartId);
    }
  }, []);

  
  useEffect(() => {
    const loadUserCart = async () => {
      try {
        const userId = UserData()?.user_id;
        if (!userId) return;
        
        
        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            setCart(parsedCart);
            
            
            const total = parsedCart.reduce((sum, item) => {
              const price = typeof item.price === 'string' 
                ? parseFloat(item.price) 
                : item.price;
              return sum + (isNaN(price) ? 0 : price);
            }, 0);
            
            setOrderTotal(total);
          } catch (e) {
            // console.error("Error parsing cart from localStorage:", e);
          }
        } else {
          
          const cartIdToUse = localStorage.getItem('cart_id');
          if (cartIdToUse) {
            const response = await useAxios().get(`/course/cart-list/${cartIdToUse}/`);
            if (response.data && Array.isArray(response.data)) {
              
              const backendCart = response.data.map(item => ({
                id: item.course.id,
                title: item.course.title,
                price: parseFloat(item.price).toFixed(2),
                image: item.course.image,
                level: item.course.level,
                cartId: cartIdToUse
              }));
              
              setCart(backendCart);
              localStorage.setItem('user_cart', JSON.stringify(backendCart));
              
              
              const total = backendCart.reduce((sum, item) => {
                const price = typeof item.price === 'string' 
                  ? parseFloat(item.price) 
                  : item.price;
                return sum + (isNaN(price) ? 0 : parseFloat(price));
              }, 0);
              
              setOrderTotal(total);
            }
          }
        }
      } catch (error) {
        // console.error("Error loading cart:", error);
      }
    };
    
    loadUserCart();
  }, []);

  
useEffect(() => {
  const initializeCart = async () => {
    const userId = UserData()?.user_id;
    if (!userId) return;
    
    // console.log("Initializing persistent cart for user:", userId);
    
    
    let cartIdToUse = localStorage.getItem('cart_id');
    
    
    
    const expectedCartId = `user_${userId}`;
    
    if (!cartIdToUse || !cartIdToUse.includes(userId)) {
      cartIdToUse = expectedCartId;
      localStorage.setItem('cart_id', cartIdToUse);
      setCartId(cartIdToUse);
      // console.log("Created new persistent cart ID:", cartIdToUse);
    } else {
      // console.log("Using existing cart ID:", cartIdToUse);
    }
    
    
    try {
      const response = await useAxios().get(`/course/cart-list/${cartIdToUse}/`);
      
      if (response.data && Array.isArray(response.data)) {
        
        const backendCart = response.data.map(item => ({
          id: item.course.id,
          title: item.course.title,
          price: parseFloat(item.price).toFixed(2),
          image: item.course.image,
          level: item.course.level
        }));
        
        setCart(backendCart);
        
        
        const total = backendCart.reduce((sum, item) => {
          const price = typeof item.price === 'string' 
            ? parseFloat(item.price) 
            : item.price;
          return sum + (isNaN(price) ? 0 : parseFloat(price));
        }, 0);
        
        setOrderTotal(total);
        // console.log("Loaded persistent cart with", backendCart.length, "items");
      }
    } catch (error) {
      // console.error("Error loading cart:", error);
    }
  };
  
  initializeCart();
}, [UserData()?.user_id]); 


useEffect(() => {
  
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  
  if (paymentStatus === 'success') {
    
    Toast().fire({
      icon: "success",
      title: "Payment Successful!",
      text: "Your course enrollment is complete. You can now access your courses."
    });
    
    
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    
    
    const orderOid = urlParams.get('order');
    if (orderOid) {
      // console.log(`Order ID: ${orderOid}`);
      
      
      
      fetchData();
      
      
      setCart([]);
      const userId = UserData()?.user_id;
      if (userId) {
        const cartIdToUse = `user_${userId}`;
        localStorage.removeItem('user_cart');
        clearCart();
      }
    }
  }
}, []);


  const handleSearch = (e) => {
  const query = e.target.value;
  setSearchQuery(query);
  // We don't need additional logic here since we're filtering directly in the render
}

  const openPopup = (category) => {
    setPopupCategory(category); 
    setShowPopup(true); 
  };

  const closePopup = () => {
    setShowPopup(false); 
    setPopupCategory(null); 
  };

  const fetchUnboughtCourses = async () => {
    try {
      const userId = UserData()?.user_id; 
      if (!userId) {
        // console.error("User ID is not available.");
        return;
      }
  
      const response = await useAxios().get(`/student/unbought-courses/${userId}/`);
      
      // Process and format image URLs using IMG_BASE_URL from constants
      const coursesWithFormattedImages = response.data.map(course => {
        if (!course.image) return course;
        
        // Only format if it's a relative URL
        if (!course.image.startsWith('http') && !course.image.startsWith('https')) {
          // Clean up the path and join with the base URL
          const cleanImagePath = course.image.startsWith('/') ? course.image : `/${course.image}`;
          return {
            ...course,
            image: `${IMG_BASE_URL}${cleanImagePath}`
          };
        }
        
        return course;
      });
      
      setUnboughtCourses(coursesWithFormattedImages);
    } catch (error) {
      // console.error("Error fetching unbought courses:", error);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const response = await useAxios().get(`/subscription/`); 
    } catch (error) {
      Toast().fire({
        icon: "error",
        title: "Failed to fetch subscription details.",
      });
    }
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
      // console.log("Adding course to library:", courseId); 
      
      const response = await useAxios().post("/subscription/add-courses/", {
        course_id: courseId 
      });
  
      // console.log("Library add response:", response.data); 
      
      if (response.data.message) {
        
        if (response.data.courses && response.data.courses.length > 0) {
          const addedCourse = response.data.courses[0];
          
          
          const formattedCourse = {
            course: addedCourse,
            completed_lesson: [],
            date: new Date().toISOString()
          };
          
          
          setCourses(prevCourses => [...prevCourses, formattedCourse]);
          
          
          fetchData();
          
          Toast().fire({
            icon: "success",
            title: `${addedCourse.title} added to your courses!`,
          });
          
          
          setUnboughtCourses(unboughtCourses.filter(c => c.id !== courseId));
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
      // console.error("Error adding course to library:", error);
      if (error.response && error.response.data) {
        // console.error("Server error details:", error.response.data);
      }
      Toast().fire({
        icon: "error",
        title: "Failed to add course to your library.",
      });
    }
  };

  
const addToCart = async (course) => {
  try {
    
    const price = typeof course.price === 'string' 
      ? parseFloat(course.price) 
      : course.price;
    
    if (isNaN(price)) {
      // console.error("Invalid price:", course.price);
      Toast().fire({
        icon: "error",
        title: "Cannot add course with invalid price.",
      });
      return;
    }
    
    
    const isInCart = cart.some(item => item.id === course.id);
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
    localStorage.setItem('cart_id', cartIdToUse);
    
    
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
    // console.error("Error adding to cart:", error.response || error);
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
        title: "You must be logged in to manage your cart"
      });
      return;
    }
    
    
    const cartIdToUse = localStorage.getItem('cart_id') || `user_${userId}`;
    
    // console.log(`Removing course ${courseId} from cart ${cartIdToUse}`);
    
    
    await useAxios().delete(`/course/cart-item-delete/${cartIdToUse}/${courseId}/`);
    
    
    await refreshCartFromBackend(cartIdToUse);
    
    Toast().fire({
      icon: "success",
      title: "Item removed from cart"
    });
  } catch (error) {
    // console.error("Error removing from cart:", error);
    Toast().fire({
      icon: "error", 
      title: "Failed to remove item from cart"
    });
  }
};

  const calculateTotal = () => {
    
    const total = cart.reduce((sum, item) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price) 
        : item.price;
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
      user_id: userId
    });
    
    if (!orderResponse.data || !orderResponse.data.order_oid) {
      throw new Error('Failed to create order');
    }
    
    const orderOid = orderResponse.data.order_oid;
    // console.log("Order created successfully:", orderOid);
    
    
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
      throw new Error('No redirect URL received from payment processor');
    }
    
  } catch (error) {
    // console.error("Payment error:", error);
    
    let errorMessage = "Payment processing error. Please try again.";
    
    
    if (error.response && error.response.data) {
      if (error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      if (error.response.data.details) {
        // console.error("Error details:", error.response.data.details);
      }
    }
    
    Toast().fire({
      icon: "error",
      title: errorMessage
    });
  } finally {
    setPaymentLoading(false);
  }
};

const clearCart = async () => {
  try {
    const cartIdToUse = localStorage.getItem('cart_id');
    if (!cartIdToUse) return;
    
    
    for (const item of cart) {
      await useAxios().delete(`/course/cart-item-delete/${cartIdToUse}/${item.id}/`);
    }
    
    
    await syncCartWithBackend();
    
    Toast().fire({
      icon: "success",
      title: "Cart cleared"
    });
  } catch (error) {
    // console.error("Error clearing cart:", error);
    Toast().fire({
      icon: "error",
      title: "Failed to clear cart"
    });
  }
};

  const syncCartWithBackend = async (forceRefresh = false) => {
    try {
      const userId = UserData()?.user_id;
      if (!userId) return;
      
      // console.log("Syncing cart with backend for user:", userId);
      
      
      let cartIdToUse = localStorage.getItem('cart_id');
      if (!cartIdToUse || forceRefresh) {
        const timestamp = new Date().getTime();
        const randomStr = Math.random().toString(36).substring(2, 8);
        cartIdToUse = `cart_${timestamp}_${randomStr}_${userId}`;
        localStorage.setItem('cart_id', cartIdToUse);
        setCartId(cartIdToUse);
        // console.log("Created new cart ID:", cartIdToUse);
      }
      
      
      const response = await useAxios().get(`/course/cart-list/${cartIdToUse}/`);
      
      if (response.data && Array.isArray(response.data)) {
        
        const backendCart = response.data.map(item => ({
          id: item.course.id,
          title: item.course.title,
          price: parseFloat(item.price).toFixed(2),
          image: item.course.image,
          level: item.course.level,
          cartItemId: item.id 
        }));
        
        setCart(backendCart);
        
        
        const total = backendCart.reduce((sum, item) => {
          const price = typeof item.price === 'string' 
            ? parseFloat(item.price) 
            : item.price;
          return sum + (isNaN(price) ? 0 : parseFloat(price));
        }, 0);
        
        setOrderTotal(total);
        // console.log("Cart synced from backend:", backendCart);
        
        
        
      } else {
        
        setCart([]);
        setOrderTotal(0);
        // console.log("No cart items found on backend, cleared local cart");
      }
    } catch (error) {
      // console.error("Error syncing cart with backend:", error);
    }
  };

  
const openCartPopup = async () => {
  
  await syncCartWithBackend();
  setShowCartPopup(true);
};


const refreshCartFromBackend = async (cartIdToUse) => {
  try {
    if (!cartIdToUse) {
      cartIdToUse = localStorage.getItem('cart_id');
      if (!cartIdToUse) return;
    }
    
    // console.log(`Refreshing cart with ID: ${cartIdToUse}`);
    
    const response = await useAxios().get(`/course/cart-list/${cartIdToUse}/`);
    
    if (response.data && Array.isArray(response.data)) {
      
      const backendCart = response.data.map(item => ({
        id: item.course.id,
        title: item.course.title,
        price: parseFloat(item.price).toFixed(2),
        image: item.course.image,
        level: item.course.level
      }));
      
      setCart(backendCart);
      
      
      const total = backendCart.reduce((sum, item) => {
        const price = typeof item.price === 'string' 
          ? parseFloat(item.price) 
          : item.price;
        return sum + (isNaN(price) ? 0 : parseFloat(price));
      }, 0);
      
      setOrderTotal(total);
      // console.log(`Cart refreshed, found ${backendCart.length} items`);
    }
  } catch (error) {
    // console.error("Error refreshing cart:", error);
  }
};


const proceedToCheckout = () => {
  
  setShowCartPopup(false);
  
  setShowCheckoutPopup(true);
};

  const getCategorizedFilteredCourses = () => {
  // First apply all filters to get filtered courses
  let filtered = [...courses];
  
  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(c => 
      c.course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Filter by status
  if (statusFilter === "completed") {
    filtered = filtered.filter(c => {
      const progress = courseProgress[c.course.id] || { percentage: 0 };
      return progress.percentage >= 100;
    });
  } else if (statusFilter === "in_progress") {
    filtered = filtered.filter(c => {
      const progress = courseProgress[c.course.id] || { percentage: 0 };
      return progress.percentage > 0 && progress.percentage < 100;
    });
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === "oldest") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === "title_asc") {
      return a.course.title.localeCompare(b.course.title);
    } else if (sortBy === "title_desc") {
      return b.course.title.localeCompare(a.course.title);
    }
    return 0;
  });
  
  // Now categorize the filtered results
  const categorized = {
    Beginner: filtered.filter((c) => c.course && c.course.level === "Beginner"),
    Intermediate: filtered.filter((c) => c.course && c.course.level === "Intermediate"),
    Advanced: filtered.filter((c) => c.course && c.course.level === "Advanced"),
  };
  
  // If a category filter is active, only return that category
  if (selectedCategory && selectedCategory !== "all") {
    const result = {};
    result[selectedCategory] = categorized[selectedCategory];
    return result;
  }
  
  return categorized;
};
  
  const fetchCourseProgress = async () => {
    try {
      const userId = UserData()?.user_id;
      if (!userId) return;
      
      
      const response = await useAxios().get(`/student/${userId}/progress/`);
      
      if (response.data && Array.isArray(response.data)) {
        
        const progressData = {};
        
        response.data.forEach(item => {
          progressData[item.course_id] = {
            percentage: item.progress || 0,
            completed_lectures: item.completed_lectures || 0,
            total_lectures: item.total_lectures || 0
          };
        });
        
        setCourseProgress(progressData);
      }
    } catch (error) {
      // console.error("Error fetching course progress:", error);
    }
  };
  
  
  const fetchLectureProgress = async (lectureId) => {
    try {
      const response = await useAxios().get(`/lecture/${lectureId}/progress/`);
      
      if (response.data) {
        
        setLectureProgress(prev => ({
          ...prev,
          [lectureId]: {
            percentage: response.data.percentage_complete || 0,
            completed: response.data.completed || false,
            current_time: response.data.current_time || 0
          }
        }));
        
        
        return response.data;
      }
    } catch (error) {
      // console.error("Error fetching lecture progress:", error);
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
    if (!fileType) return 'file';
    
    fileType = fileType.toLowerCase();
    
    if (fileType === 'pdf') return 'file-pdf';
    if (['doc', 'docx'].includes(fileType)) return 'file-word';
    if (['xls', 'xlsx'].includes(fileType)) return 'file-excel';
    if (['ppt', 'pptx'].includes(fileType)) return 'file-powerpoint';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) return 'file-image';
    if (['mp3', 'wav', 'ogg'].includes(fileType)) return 'file-audio';
    if (['mp4', 'mov', 'avi'].includes(fileType)) return 'file-video';
    if (['zip', 'rar', '7z'].includes(fileType)) return 'file-archive';
    
    return 'file';
  };
  
  const formatFileSize = (bytes) => {
  // Handle invalid inputs
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return 'Unknown size';
  }

  // Handle zero bytes case
  if (bytes === 0) return '0 KB';

  // Define size units (starting from KB, not Bytes)
  const sizes = ['KB', 'MB', 'GB', 'TB'];
  
  // If smaller than 1KB, just show as 1KB
  if (bytes < 1024) {
    return '1 KB';
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
        const response = await useAxios().get('/user/appearance-settings/');
        if (response.data && response.data.dark_mode !== undefined) {
          setDarkMode(response.data.dark_mode);
          // console.log("Dark mode setting loaded:", response.data.dark_mode);
        }
      } catch (error) {
        // console.error("Error fetching dark mode setting:", error);
      }
    }
    
    fetchDarkModeSetting();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar for desktop/tablet, MobileNav for mobile */}
        {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            marginLeft: !isMobile ? (sidebarCollapsed ? "80px" : "270px") : 0,
            transition: "margin-left 0.3s ease",
          }}
        >
          {/* Header */}
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

        {/* Courses Section */}
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h4>My Courses</h4>
            <button
              className="btn btn-primary"
              onClick={openAddMorePopup}
            >
              Add More
            </button>
          </div>

          {/* Enhanced filter section */}
          <div className="mb-4">
            <Row>
              <Col md={4} className="mb-3 mb-md-0">
                <Form.Group>
                  <InputGroup>
                    <InputGroup.Text><i className="fas fa-search"></i></InputGroup.Text>
                    <Form.Control

                      type="search"
                      placeholder="Search your courses"
                      value={searchQuery}
                      onChange={handleSearch}
                      style={{
                        backgroundColor: darkMode ? "rgb(255, 255, 255)" : "rgb(247, 247, 247)",
                        border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
                        color: "black"
                      }}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={darkMode ? "bg-dark text-white border-secondary" : ""}
                    style={{
                      backgroundColor: darkMode ? "rgb(255, 255, 255)" : "rgb(247, 247, 247)",
                      border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
                      color: "black"
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={darkMode ? "bg-dark text-white border-secondary" : ""}
                    style={{
                      backgroundColor: darkMode ? "rgb(255, 255, 255)" : "rgb(247, 247, 247)",
                      border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
                      color: "black"
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title_asc">Title (A-Z)</option>
                    <option value="title_desc">Title (Z-A)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={darkMode ? "bg-dark text-white border-secondary" : ""}
                    style={{
                      backgroundColor: darkMode ? "rgb(255, 255, 255)" : "rgb(247, 247, 247)",
                      border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
                      color: "black"
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {fetching && <p>Loading...</p>}

          {/* Display courses by category */}
          {!fetching &&
            Object.keys(getCategorizedFilteredCourses()).map((category) => {
              const categoryCourses = getCategorizedFilteredCourses()[category];
              if (categoryCourses.length === 0) return null;
              
              return (
                <div key={category} style={{ marginBottom: "40px" }}>
                  <h5>{category} Courses</h5>
                  <Row>
                    {categoryCourses.slice(0, 5).map((c, index) => {
                      // Get progress data for this course
                      const progress = courseProgress[c.course.id] || { percentage: 0 };
                      const isCompleted = progress.percentage >= 100;
                      
                      return (
                        <Col key={index} md={6} lg={4} xl={3} className="mb-4">
                          <Card 
                            className={`h-100 ${darkMode ? "bg-dark text-white" : ""}`}
                            style={{
                              boxShadow: darkMode ? "0 0 10px rgba(0, 0, 0, 0.5)" : "0 0 10px rgba(0, 0, 0, 0.1)",
                              border: "none",
                              overflow: "hidden"
                            }}
                          >
                            <div className="position-relative">
                              {/* Course Image with consistent height */}
                              <div style={{ height: "180px", overflow: "hidden" }}>
                                {c.course.image ? (
                                  <img
                                    src={c.course.image}
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
                                    {c.course.title && typeof c.course.title === "string"
                                      ? c.course.title.charAt(0).toUpperCase()
                                      : "?"}
                                  </div>
                                )}
                                
                                {/* Status badge */}
                                {isCompleted && (
                                  <div style={{
                                    position: "absolute",
                                    top: "10px",
                                    right: "10px",
                                    backgroundColor: "#28a745",
                                    color: "white",
                                    padding: "3px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                  }}>
                                    Completed
                                  </div>
                                )}
                                
                                {c.added_via_subscription && (
                                  <div style={{
                                    position: "absolute",
                                    top: isCompleted ? "40px" : "10px",
                                    right: "10px",
                                    backgroundColor: "#007bff",
                                    color: "white",
                                    padding: "3px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                  }}>
                                    Subscription
                                  </div>
                                )}
                              </div>
                            </div>

                            <Card.Body className="d-flex flex-column">
                              {/* Truncated title with proper styling */}
                              <div className="fw-bold mb-2" style={{ 
                                fontSize: "16px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}>
                                {c.course.title}
                              </div>
                              
                              {/* Level and date in flex row */}
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span style={{
                                  backgroundColor: getLevelColor(c.course.level),
                                  color: "white",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "11px"
                                }}>
                                  {c.course.level}
                                </span>
                                <small style={{ color: darkMode ? "#aaa" : "#6c757d" }}>
                                  {moment(c.date).format("MMM D, YYYY")}
                                </small>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="progress mb-3" style={{ height: "5px" }}>
                                <div 
                                  className="progress-bar" 
                                  role="progressbar"
                                  style={{ 
                                    width: `${progress.percentage}%`, 
                                    backgroundColor: "#EF4135" 
                                  }}
                                />
                              </div>
                              
                              {/* Action button at bottom */}
                              <div className="mt-auto">
                                <button
                                  className="btn btn-primary w-100"
                                  onClick={() => openLecturePopup(c.course)}
                                >
                                  {progress.percentage > 0 ? "Continue" : "Start"}
                                </button>
                                {progress && progress.percentage >= 100 && (
                                  <button 
                                    className="btn btn-outline-success btn-sm mt-2"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent opening the lecture popup
                                      openCertificateModal(c.course);
                                    }}
                                  >
                                    <i className="fas fa-certificate me-1"></i>
                                    View Certificate
                                  </button>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}

                    {/* View More card */}
                    {categoryCourses.length > 5 && (
                      <Col md={6} lg={4} xl={3} className="mb-4">
                        <Card
                          className={`h-100 d-flex justify-content-center align-items-center ${darkMode ? "bg-dark text-white" : ""}`}
                          style={{
                            backgroundColor: "#007bff",
                            color: "white",
                            cursor: "pointer",
                            boxShadow: darkMode ? "0 0 10px rgba(0, 0, 0, 0.5)" : "0 0 10px rgba(0, 0, 0, 0.1)",
                            height: "280px"
                          }}
                          onClick={() => openPopup(category)}
                        >
                          <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
                            <i className="fas fa-th-large mb-3" style={{ fontSize: "32px" }}></i>
                            <h5>View More</h5>
                          </Card.Body>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </div>
              );
            })}

          {courses.length === 0 && !fetching && (
            <p>No courses found. Start adding courses!</p>
          )}
        </div>
      </div>
      
      {/* Lecture Popup */}
{showLecturePopup && selectedCourse && (
  <div
    className={`lecture-popup ${darkMode ? "dark" : ""}`}
    style={{
      position: "fixed",
      top: isMobile ? "0" : "60px", /* Position at top on mobile */
      left: isMobile ? "0" : (sidebarCollapsed ? "80px" : "270px"), /* Full width on mobile */
      width: isMobile ? "100%" : `calc(100% - ${sidebarCollapsed ? "80px" : "270px"})`,
      height: isMobile ? "100vh" : "calc(100vh - 60px)", /* Full height on mobile */
      backgroundColor: darkMode ? "#121212" : "#fff",
      color: darkMode ? "#e0e0e0" : "inherit",
      zIndex: 1000,
      display: "flex",
      flexDirection: isMobile ? "column" : "row", /* Stack vertically on mobile */
      overflow: "hidden",
      transition: "left 0.3s ease, width 0.3s ease",
    }}
  >
    {isMobile ? (
      // Mobile Layout - Stacked Vertically
      <>
        {/* Course Progress Section - At the top */}
        <div style={{
          padding: "15px",
          backgroundColor: darkMode ? "#1e1e1e" : "#f8f8f8",
          borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10
        }}>
          <div style={{display: "flex", alignItems: "center"}}>
            <div style={{marginRight: "15px"}}>
              <ProgressCircle
                percentage={
                  lectures.length > 0
                    ? Math.round(
                        (Object.values(lectureProgress).filter((p) => p.completed).length /
                          lectures.length) *
                          100
                      )
                    : 0
                }
                size={50} /* Smaller on mobile */
                strokeWidth={5}
                strokeColor="#4285f4"
              />
            </div>
            
            {/* Progress Text */}
            <div>
              <div style={{fontWeight: "bold", fontSize: "14px"}}>COURSE PROGRESS</div>
              <div style={{fontSize: "12px", color: "#777"}}>
                {Object.values(lectureProgress).filter(p => p.completed).length}/{lectures.length}
              </div>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={closeLecturePopup}
            style={{
              background: "none",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
              color: "#666",
              padding: "8px"
            }}
          >
            ×
          </button>
        </div>
        
        {/* Course Title */}
        <div style={{
          padding: "10px 15px",
          backgroundColor: darkMode ? "#1e1e1e" : "#f8f8f8",
          color: darkMode ? "#e0e0e0" : "#333",
          borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
          fontWeight: "bold",
          fontSize: "16px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {selectedCourse.title}
        </div>

        {/* Video Player Container */}
        <div
          ref={videoContainerRef}
          style={{
            width: "100%",
            height: "30vh", /* Smaller height on mobile */
            backgroundColor: "#000",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Loading Spinner Overlay */}
          {isVideoLoading && (
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              zIndex: 10
            }}>
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs for Description and Resources */}
        <div style={{
          display: 'flex',
          borderBottom: darkMode ? "1px solid #333" : "1px solid #ddd",
          backgroundColor: darkMode ? "#1e1e1e" : "#f8f8f8",
          flexShrink: 0
        }}>
          <div
            onClick={() => setActiveTab('description')}
            style={{ 
              padding: '10px 15px', 
              cursor: 'pointer', 
              fontWeight: activeTab === 'description' ? 'bold' : 'normal',
              color: activeTab === 'description' ? "#4285f4" : (darkMode ? "#e0e0e0" : "inherit"),
              borderBottom: activeTab === 'description' ? "2px solid #4285f4" : "none",
              width: "50%",
              textAlign: "center"
            }}
          >
            Description
          </div>
          <div
            onClick={() => setActiveTab('resources')}
            style={{ 
              padding: '10px 15px', 
              cursor: 'pointer', 
              fontWeight: activeTab === 'resources' ? 'bold' : 'normal',
              color: activeTab === 'resources' ? "#4285f4" : (darkMode ? "#e0e0e0" : "inherit"),
              borderBottom: activeTab === 'resources' ? "2px solid #4285f4" : "none",
              width: "50%",
              textAlign: "center"
            }}
          >
            Resources
          </div>
        </div>

        {/* Content Area Below Tabs */}
        <div style={{
          flex: "0 0 auto", /* Don't grow, allow scrolling */
          height: "20vh", /* Fixed height for content */
          overflowY: "auto",
          padding: "15px",
          backgroundColor: darkMode ? "#121212" : "#fff",
          color: darkMode ? "#e0e0e0" : "inherit",
        }}>
          {/* Conditional Content Based on Active Tab - same as desktop */}
          {activeTab === 'description' && selectedLecture && (
            <div>
              <h5>{selectedLecture.title || 'Lecture Title'}</h5>
              <p>{selectedLecture.description || 'Lecture description goes here...'}</p>
            </div>
          )}
          {activeTab === 'resources' && (
            // Resources tab content - same as desktop
            <div>
              <h5>Resources</h5>
              {/* ... existing resources code ... */}
              {loadingResources ? (
                <div className="d-flex justify-content-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : lectureResources.length > 0 ? (
                <div className="list-group mt-2">
                  {/* ... existing resources list ... */}
                  {lectureResources.map(resource => (
                    <div 
                      key={resource.id} 
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px", 
                        marginBottom: "8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                        border: darkMode ? "1px solid #444" : "1px solid rgb(0, 114, 254)",
                        color: darkMode ? "#e0e0e0" : "inherit",
                      }}
                      className="list-group-item-action"
                    >
                    {/* ... existing resource item content ... */}
                      <div>
                        <div className="d-flex align-items-center">
                          <i className={`fas fa-${getResourceIcon(resource.file_type)} me-2 text-primary`} style={{ fontSize: "14px" }}></i>
                          <div>
                            <h6 className="mb-0" style={{ color: darkMode ? "#fff" : "inherit", fontSize: "14px" }}>
                              {resource.title}
                            </h6>
                            <small style={{ color: darkMode ? "#aaa" : "#6c757d", fontSize: "12px" }}>
                              {resource.file_type?.toUpperCase() || 'Unknown'} • {formatFileSize(resource.file_size)}
                            </small>
                          </div>
                        </div>
                      </div>
                      <button 
                        style={{
                          color: darkMode ? "#4285f4" : "",
                          borderColor: darkMode ? "#4285f4" : "#4285f4",
                          backgroundColor: darkMode ? "transparent" : "",
                          padding: "4px 8px",
                          fontSize: "12px"
                        }}
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => downloadResource(resource)}
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : selectedLecture ? (
                <div 
                  className="alert mt-3"
                  style={{
                    backgroundColor: darkMode ? "#2a3f54" : "#cff4fc",
                    color: darkMode ? "#8fcaff" : "#055160",
                    borderColor: darkMode ? "#1f3146" : "#b6effb"
                  }}
                >
                  <i className="fas fa-info-circle me-2"></i>
                  No resources available for this lecture.
                </div>
              ) : (
                <p style={{ color: darkMode ? "#aaa" : "#6c757d" }} className="mt-3">
                  Select a lecture to view its resources.
                </p>
              )}
            </div>
          )}
          {!selectedLecture && activeTab === 'description' && (
              <p>Select a lecture to view its description.</p>
          )}
        </div>

        {/* Lectures List - at the bottom */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: darkMode ? "#121212" : "#fff",
          borderTop: darkMode ? "1px solid #333" : "1px solid #eee"
        }}>
          <div style={{
            padding: "10px 15px",
            backgroundColor: darkMode ? "#1e1e1e" : "#f8f8f8",
            borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
            fontSize: "14px",
            fontWeight: "bold"
          }}>
            Lectures
          </div>
          <ul style={{ 
            listStyle: "none", 
            padding: "0", 
            margin: 0 
          }}>
            {lectures.map((lecture) => {
              const progress = lectureProgress[lecture.id] || { percentage: 0, completed: false };
              const isSelected = selectedLecture?.id === lecture.id;
              
              return (
                <li
                  key={lecture.id}
                  style={{
                    cursor: "pointer",
                    padding: "12px 15px",
                    backgroundColor: isSelected ? "#4285f4" : (darkMode ? "#121212" : "transparent"),
                    color: isSelected ? "rgb(255, 255, 255)" : (darkMode ? "#e0e0e0" : "#333"),
                    borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => handleLectureSelect(lecture)}
                >
                  {/* Status indicator */}
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    marginRight: "10px",
                    backgroundColor: isSelected ? "#fff" : 
                                  progress.completed ? "#4285f4" : darkMode ? "#555" : "#ccc",
                  }}></div>
                  
                  <span style={{ fontSize: "14px" }}>{lecture.title}</span>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Quiz Modal */}
        {showQuizModal && linkedQuizId && (
          <QuizModal
            quizId={linkedQuizId}
            show={showQuizModal}
            onClose={() => setShowQuizModal(false)}
          />
        )}
      </>
    ) : (
      // Desktop Layout - Side-by-side
      <>
        {/* Left Section: Video Player and Description/Resources */}
        <div
          style={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            borderRight: darkMode ? "1px solid #333" : "1px solid #ddd",
          }}
        >
          {/* Video Player Container */}
          <div
            ref={videoContainerRef}
            style={{
              width: "100%",
              height: "60%",
              backgroundColor: "#000",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Loading Spinner Overlay */}
            {isVideoLoading && (
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                zIndex: 10
              }}>
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs for Description and Resources */}
          <div style={{
            display: 'flex',
            borderBottom: darkMode ? "1px solid #333" : "1px solid #ddd",
            backgroundColor: darkMode ? "#1e1e1e" : "#f8f8f8",
            flexShrink: 0
          }}>
            {/* ... existing tab buttons ... */}
            <div
              onClick={() => setActiveTab('description')}
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer', 
                fontWeight: activeTab === 'description' ? 'bold' : 'normal',
                color: darkMode ? "#e0e0e0" : "inherit"
              }}
            >
              Description
            </div>
            <div
              onClick={() => setActiveTab('resources')}
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer', 
                fontWeight: activeTab === 'resources' ? 'bold' : 'normal',
                color: darkMode ? "#e0e0e0" : "inherit"
              }}
            >
              Resources
            </div>
          </div>

          {/* Content Area Below Tabs */}
          <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              backgroundColor: darkMode ? "#121212" : "#fff",
              color: darkMode ? "#e0e0e0" : "inherit",
            }}
          >
            {/* ... existing content tabs (description/resources) ... */}
            {activeTab === 'description' && selectedLecture && (
              <div>
                <h4>{selectedLecture.title || 'Lecture Title'}</h4>
                <p>{selectedLecture.description || 'Lecture description goes here...'}</p>
              </div>
            )}
            {activeTab === 'resources' && (
              <div>
                <h4>Resources</h4>
                {/* ... existing resources content ... */}
              </div>
            )}
            {!selectedLecture && activeTab === 'description' && (
                <p>Select a lecture to view its description.</p>
            )}
          </div>
        </div>

        {/* Right Section: Lecture List with fixed width*/}
        <div
          style={{
            width: "400px",
            backgroundColor: darkMode ? "#121212" : "#fff",
            color: darkMode ? "#e0e0e0" : "inherit",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            position: "relative"
          }}
        >
          {/* Course Title Header */}
          <div style={{
            padding: "15px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #eee"
          }}>
            
          </div>

          {/* Course Progress Section - Styled exactly like screenshot */}
          <div style={{
            padding: "15px 20px",
            backgroundColor: "rgba(0,0,0,0)", 
            borderBottom: "1px solid rgba(0,0,0,0)",
            borderRadius: "10px",
            margin: "10px"
          }}>
            {/* Progress Circle and Text in a Row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              {/* Blue Progress Circle */}
              <div style={{display: "flex", alignItems: "center"}}>
                <div style={{marginRight: "15px"}}>
                  <ProgressCircle
                    percentage={
                      lectures.length > 0
                        ? Math.round(
                            (Object.values(lectureProgress).filter((p) => p.completed).length /
                              lectures.length) *
                              100
                          )
                        : 0
                    }
                    size={60}
                    strokeWidth={6}
                    strokeColor="#4285f4"
                  />
                </div>
                
                {/* Progress Text */}
                <div>
                  <div style={{fontWeight: "bold", fontSize: "15px"}}>COURSE PROGRESS</div>
                  <div style={{fontSize: "14px", color: "#777"}}>
                    {Object.values(lectureProgress).filter(p => p.completed).length}/{lectures.length}
                  </div>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={closeLecturePopup}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Course Title Section */}
          <div style={{
            padding: "12px 20px",
            backgroundColor: darkMode ? "#1e1e1e" : "#f8f8f8",
            borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
            color: darkMode ? "#e0e0e0" : "#333",
            fontWeight: "bold",
          }}>
            {selectedCourse.title}
          </div>
          {showQuizModal && linkedQuizId && (
            <QuizModal
              quizId={linkedQuizId}
              show={showQuizModal}
              onClose={() => setShowQuizModal(false)}
            />
          )}
          
          {/* Lectures List */}
          <ul style={{ 
            listStyle: "none", 
            padding: "10px 0", 
            margin: 0,
            overflowY: "auto",
            flex: 1
          }}>
            {/* ... existing lecture items ... */}
            {lectures.map((lecture) => {
              const progress = lectureProgress[lecture.id] || { percentage: 0, completed: false };
              const isSelected = selectedLecture?.id === lecture.id;
              
              return (
                <li
                  key={lecture.id}
                  style={{
                    cursor: "pointer",
                    padding: "12px 20px",
                    backgroundColor: isSelected ? "#4285f4" : (darkMode ? "#121212" : "transparent"),
                    color: isSelected ? "rgb(255, 255, 255)" : (darkMode ? "#e0e0e0" : "#333"),
                    borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: isSelected ? "5px" : "0",
                    margin: isSelected ? "0 5px" : "0",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => handleLectureSelect(lecture)}
                >
                  {/* Status indicator */}
                  <div style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    marginRight: "12px",
                    backgroundColor: isSelected ? "#fff" : 
                                progress.completed ? "#4285f4" : darkMode ? "#555" : "#ccc",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                    
                  }}></div>
                  
                  <span style={{ fontSize: "14px" }}>{lecture.title}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </>
    )}
  </div>
)}

      {/* View More Popup */}
      {showPopup && popupCategory && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: "600px",
            backgroundColor: darkMode ? "#121212" : "rgb(247, 247, 247)",
            zIndex: 1000,
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}
        >
          {/* Popup Header */}
          <div
            style={{
              backgroundColor: "#007bff",
              color: "#fff",
              padding: "15px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            {popupCategory} Courses
            <button
              onClick={closePopup}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
          </div>

          {/* Popup Content */}
          <div
            style={{
              padding: "20px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
              {getCategorizedFilteredCourses()[popupCategory].map((c, index) => {
                const progress = courseProgress[c.course.id] || { percentage: 0 };
                const isCompleted = progress.percentage >= 100;
                
                return (
                  <Card
                    key={index}
                    className={`${darkMode ? "bg-dark text-white" : ""}`}
                    style={{
                      width: "220px",
                      boxShadow: darkMode ? "0 0 10px rgba(0, 0, 0, 0.5)" : "0 0 10px rgba(0, 0, 0, 0.1)",
                      border: "none",
                      overflow: "hidden"
                    }}
                  >
                    <div style={{ height: "140px", overflow: "hidden", position: "relative" }}>
                      {c.course.image ? (
                        <img
                          src={c.course.image}
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
                          {c.course.title && typeof c.course.title === "string"
                            ? c.course.title.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}
                      
                      {/* Unbought courses don't have completion status */}
                    </div>
                    
                    <Card.Body>
                      <Card.Title className="text-truncate">{c.course.title}</Card.Title>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{
                          backgroundColor: getLevelColor(c.course.level),
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px"
                        }}>
                          {c.course.level}
                        </span>
                        <small>{moment(c.date).format("MMM D, YYYY")}</small>
                      </div>
                      
                      <div className="mt-2 d-flex justify-content-between align-items-center">
                        <span className="fw-bold" style={{ fontSize: "18px" }}>
                          R{parseFloat(c.price || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="mt-auto pt-2">
                        {userSubscription?.is_active &&
                        (userSubscription.include_all_courses ||
                          (userSubscription.courses && userSubscription.courses.includes(c.id))) ? (
                          <button
                            className="btn btn-success w-100"
                            onClick={() => addToLibrary(c.id)} 
                          >
                            Add to Library
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary w-100"
                            onClick={() => addToCart(c)} 
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
        
      )}

      {/* Add More Popup */}
      {showAddMorePopup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: "800px",
            backgroundColor: darkMode ? "#121212" : "#fff",
            zIndex: 1000,
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}
        >
          {/* Popup Header */}
          <div
            style={{
              backgroundColor: "#007bff",
              color: "#fff",
              padding: "15px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "18px",
              position: "relative",
            }}
          >
            Add More Courses
            <button
              onClick={closeAddMorePopup}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              &times;
            </button>

            {/* Cart Icon */}
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={openCartPopup} 
            >
              <i
                className="fas fa-shopping-cart"
                style={{ fontSize: "24px", marginRight: "5px", color: "white" }}
              ></i>
              <span
                style={{
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: "12px",
                }}
              >
                {cart.length}
              </span>
            </div>
          </div>

          {/* Popup Content */}
          <div
            style={{
              padding: "20px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {["Beginner", "Intermediate", "Advanced"].map((category) => {
              const categoryCourses = unboughtCourses.filter(
                (course) => course.level === category
              );
              
              if (categoryCourses.length === 0) return null;
              
              return (
                <div key={category} style={{ marginBottom: "30px" }}>
                  <h5 className="mb-3">{category} Courses</h5>
                  <Row className="g-3">
                    {categoryCourses.map((course) => (
                      <Col key={course.id} sm={6} md={4} lg={3}>
                        <Card
                          className={`${darkMode ? "bg-dark text-white" : ""}`}
                          style={{
                            boxShadow: darkMode ? "0 0 10px rgba(0, 0, 0, 0.5)" : "0 0 10px rgba(0, 0, 0, 0.1)",
                            border: "none",
                            overflow: "hidden"
                          }}
                        >
                          <div style={{ height: "150px", overflow: "hidden", position: "relative" }}>
                            {course.image ? (
                              <img
                                src={course.image}
                                alt={course.title}
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
                            
                            {/* Unbought courses don't have completion status */}
                          </div>
                          
                          <Card.Body>
                            <Card.Title className="text-truncate">{course.title}</Card.Title>
                            
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span style={{
                                backgroundColor: getLevelColor(course.level),
                                color: "white",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px"
                              }}>
                                {course.level}
                              </span>
                              <small>{moment(course.date).format("MMM D, YYYY")}</small>
                            </div>
                            
                            <div className="mt-2 d-flex justify-content-between align-items-center">
                              <span className="fw-bold" style={{ fontSize: "18px" }}>
                                R{parseFloat(course.price || 0).toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="mt-auto pt-2">
                              {userSubscription?.is_active &&
                              (userSubscription.include_all_courses ||
                                (userSubscription.courses && userSubscription.courses.includes(course.id))) ? (
                                <button
                                  className="btn btn-success w-100"
                                  onClick={() => addToLibrary(course.id)} 
                                >
                                  Add to Library
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary w-100"
                                  onClick={() => addToCart(course)} 
                                >
                                  Add to Cart
                                </button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              );
            })}
          </div>
          {/* Mobile navigation at the bottom for mobile screens */}
                {isMobile && <MobileNav />}
        </div>
      )}

      {/* Cart Popup */}
      {showCartPopup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            backgroundColor: darkMode ? "#333" : "rgb(247, 247, 247)",
            border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
            zIndex: 1000,
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <h5>Your Cart</h5>
          {/* Cart Items Display */}
          <ul>
            {cart.map((item, index) => (
              <li key={`cart-item-${item.id}-${index}`} style={{ marginBottom: "10px" }}>
                {item.title} - R
                {parseFloat(item.price).toFixed(2)} {/* Consistently format price */}
                <button
                  className="btn btn-danger btn-sm"
                  style={{ marginLeft: "10px" }}
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p>Total: R{orderTotal.toFixed(2)}</p> {/* Display total in Rands */}
          <button
              className="btn btn-primary"
              onClick={proceedToCheckout}
              style={{ marginRight: "10px" }}
              disabled={cart.length === 0}
          >
              Checkout
          </button>
          <button
              className="btn btn-secondary"
              onClick={() => setShowCartPopup(false)}
          >
              Close
          </button>
      </div>
  )}
      {/* Checkout Popup */}
{showCheckoutPopup && (
  <div
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "450px",
      backgroundColor: darkMode ? "#333" : "rgb(247, 247, 247)",
      border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
      zIndex: 1000,
      borderRadius: "10px",
      padding: "20px",
    }}
  >
    <h5>Checkout</h5>
    <ul>
      {cart.map((item, index) => (
        <li key={`checkout-item-${item.id}-${index}`} style={{ marginBottom: "10px" }}>
          {item.title} - R{parseFloat(item.price).toFixed(2)}
          <button
            className="btn btn-danger btn-sm"
            style={{ marginLeft: "10px" }}
            onClick={() => removeFromCart(item.id)}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
    <p>Total: R{calculateTotal().toFixed(2)}</p>
    
    <button
      className="btn btn-success"
      onClick={payWithYoco}
      disabled={paymentLoading}
      style={{ marginRight: "10px" }}
    >
      {paymentLoading ? "Processing..." : "Pay with Yoco"}
    </button>
    <button
      className="btn btn-secondary"
      onClick={() => setShowCheckoutPopup(false)}
    >
      Close
    </button>
  </div>
)}

      {/* Finally, add the CertificateModal component at the end of your return statement: */}
      {showCertificateModal && (
        <CertificateModal
          show={showCertificateModal}
          handleClose={() => setShowCertificateModal(false)}
          studentId={UserData()?.user_id}
          courseId={certificateCourseId}
        />
      )}
      {isMobile && <MobileNav />}
      {/* Mobile Navigation (shown only on mobile devices) */}
      {isMobile && <MobileNav />}
    </div>
  );
}


const ProgressCircle = ({ percentage, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  
  const progressColor = "#4285f4";
  
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#eeeeee"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size / 3.5}px`,
          fontWeight: 'bold',
          color: progressColor, 
        }}
      >
        {percentage}%
      </div>
    </div>
  );
}

export default Courses;

