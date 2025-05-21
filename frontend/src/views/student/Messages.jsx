import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
  Spinner,
  Badge,
  Modal,
} from "react-bootstrap";
import useAxios from "../../utils/useAxios";
import { useNavigate } from "react-router-dom";
import Toast from "../plugin/Toast";
import { format } from "date-fns";
import { API_BASE_URL, IMG_BASE_URL } from "../../utils/constants";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import UserData from "../plugin/UserData";
import MobileNav from "./Partials/Mobile_Nav";

// Default avatar as a base64 string for reliability
const DEFAULT_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48Y2lyY2xlIGN4PSIxMjgiIGN5PSIxMjgiIHI9IjEyMCIgZmlsbD0iI2U5ZWNlZiIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9IjExMCIgcj0iNDAiIGZpbGw9IiM2Yzc1N2QiLz48cGF0aCBkPSJNMjE0LDIxMEE5MCw5MCwwLDAsMSwxMjgsMTcwYTkwLDkwLDAsMCwxLTg2LDQwYTkwLDkwLDAsMCwwLDg2LDQwQTkwLDkwLDAsMCwwLDIxNCwyMTBaIiBmaWxsPSIjNmM3NTdkIi8+PC9zdmc+";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const messageContainerRef = useRef(null);
  const api = useAxios();
  const navigate = useNavigate();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [fileInputRef, setFileInputRef] = useState(React.createRef());
  const [imageInputRef, setImageInputRef] = useState(React.createRef());
  const [documentInputRef, setDocumentInputRef] = useState(React.createRef());
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [showConversationOnMobile, setShowConversationOnMobile] = useState(false);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Update fetchConversations to log the full structure
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/conversations/");
      // console.log("Fetched conversations:", JSON.stringify(response.data));

      // Make sure other_participant is properly structured in all conversations
      const formattedConversations = response.data.map((conv) => {
        // Ensure other_participant exists and has minimal required fields
        if (!conv.other_participant) {
          conv.other_participant = {};
        }

        // Log specific conversation participant data to debug
        // console.log(
        //   `Conversation ${conv.id} other_participant:`,
        //   conv.other_participant
        // );

        return conv;
      });

      setConversations(formattedConversations);
    } catch (error) {
      // console.error("Error fetching conversations:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load conversations",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/users/profiles/");
      // console.log("Fetched users:", response.data);
      setAllUsers(response.data);
    } catch (error) {
      // console.error("Error fetching users:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load users",
      });
    }
  };

  // Improved fetch current user info
  const fetchCurrentUser = async () => {
    try {
      const userId = UserData()?.user_id;
      if (!userId) {
        // console.error("No user ID found");
        return;
      }

      const response = await api.get(`/user/profile/${userId}/`);
      // console.log("Fetched current user:", response.data);
      setCurrentUser(response.data);
    } catch (error) {
      // console.error("Error fetching current user profile:", error);
      if (error.response && error.response.status === 401) {
        navigate("/");
      }
    }
  };

  // Handle conversation selection
  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    
    // If on mobile, show the conversation view
    if (isMobile) {
      setShowConversationOnMobile(true);
    }
  };
  
  // Function to go back to contacts list on mobile
  const handleBackToContacts = () => {
    if (isMobile) {
      setShowConversationOnMobile(false);
    }
  };

  // Fetch messages for a selected conversation
  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const response = await api.get(`/conversations/${conversationId}/`);
      // console.log("Fetched messages:", response.data);
      setMessages(response.data.messages || []);

      // Update conversation in the list to reflect read status
      setConversations((prevConversations) => {
        return prevConversations.map((conv) => {
          if (conv.id === conversationId) {
            return { ...conv, unread_count: 0 };
          }
          return conv;
        });
      });
    } catch (error) {
      // console.error("Error fetching messages:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load messages",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send typing status
  const sendTypingStatus = async (isTyping) => {
    if (!selectedConversation) return;

    try {
      await api.post("/typing-status/", {
        conversation_id: selectedConversation.id,
        is_typing: isTyping,
      });
    } catch (error) {
      // console.error("Error sending typing status:", error);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout - stop typing indicator after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(false);
    }, 2000);
  };
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      Toast().fire({
        icon: "error",
        title: "Please select an image file",
      });
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      Toast().fire({
        icon: "error",
        title: "File size exceeds 20MB limit",
      });
      return;
    }

    // Just set the file for preview, don't send yet
    setSelectedFile(file);
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is a document
    const validDocTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
    ];
    if (!validDocTypes.includes(file.type)) {
      Toast().fire({
        icon: "error",
        title: "Please select a valid document file (PDF, DOC, DOCX, TXT, RTF)",
      });
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      Toast().fire({
        icon: "error",
        title: "File size exceeds 20MB limit",
      });
      return;
    }

    // Just set the file for preview, don't send yet
    setSelectedFile(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size only
    if (file.size > MAX_FILE_SIZE) {
      Toast().fire({
        icon: "error",
        title: "File size exceeds 20MB limit",
      });
      return;
    }

    // Just set the file for preview, don't send yet
    setSelectedFile(file);
  };

  // Common file attachment handler
  const handleFileAttachment = (file) => {
    // Create FormData to upload file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversation_id", selectedConversation.id);

    setNewMessage(`Sending file: ${file.name}...`);

    // Upload the file
    api
      .post("/messages/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        // Clear the message input after successful upload
        setNewMessage("");

        // Refresh messages to show the new file message
        fetchMessages(selectedConversation.id);

        Toast().fire({
          icon: "success",
          title: "File uploaded successfully",
        });
      })
      .catch((error) => {
        // console.error("Error uploading file:", error);
        Toast().fire({
          icon: "error",
          title: "Failed to upload file",
        });
        setNewMessage("");
      });
  };

  // Modify the sendMessage function to correctly handle files
const sendMessage = async (e) => {
  e.preventDefault();
  if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;

  try {
    // Clear typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(false);

    // Create form data for potentially sending file
    const formData = new FormData();
    formData.append("conversation_id", selectedConversation.id);

    if (newMessage.trim()) {
      formData.append("content", newMessage);
    }

    // Add the file to form data if present
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    // Create optimistic message to display immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: newMessage || "",
      is_sender: true,
      sender_name: "You",
      created_at: new Date().toISOString(),
    };

    // If there's a file, add temporary file preview data
    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        optimisticMessage.attachment = URL.createObjectURL(selectedFile);
      } else {
        optimisticMessage.tempAttachment = true; 
        optimisticMessage.tempFileName = selectedFile.name;
      }
    }

    // Add to messages immediately
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

    // Update conversation preview immediately
    updateConversationLastMessage(
      selectedConversation.id,
      newMessage || `[File: ${selectedFile?.name || "attachment"}]`
    );

    // Save current message and file for debugging
    const messageToBeSent = newMessage;
    const fileToBeSent = selectedFile;

    // Clear inputs before API call for better UX
    setNewMessage("");
    setSelectedFile(null);

    // console.log("Sending message with formData:", {
    //   conversation_id: selectedConversation.id,
    //   content: messageToBeSent,
    //   hasFile: !!fileToBeSent,
    //   fileName: fileToBeSent?.name
    // });

    // Send the message with proper multipart/form-data content type
    const response = await api.post("/messages/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // console.log("Message sent successfully:", response.data);

    // Replace optimistic message with real message from server
    setMessages((prevMessages) =>
      prevMessages.map((msg) => (msg.id === tempId ? response.data : msg))
    );

    // Fetch conversations to update order with newest message first
    fetchConversations();

  } catch (error) {
    // console.error("Error sending message:", error);
    Toast().fire({
      icon: "error",
      title: "Failed to send message",
    });

    // Remove optimistic message on error
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => !msg.id.toString().startsWith("temp-"))
    );
  }
};

  // Update conversation last message
  const updateConversationLastMessage = (conversationId, messageContent) => {
    setConversations((prevConversations) => {
      return prevConversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            last_message: {
              content: messageContent,
              timestamp: new Date().toISOString(),
              sender_name: "You",
            },
            updated_at: new Date().toISOString(),
          };
        }
        return conv;
      });
    });
  };

  // Handle user selection in new message modal
  const handleUserSelect = async (user) => {
    try {
      setLoading(true);

      // Create conversation immediately without initial message
      const response = await api.post("/conversations/", {
        participants: [user.user_id],
        message: "", // Empty initial message
      });

      // console.log("New conversation created:", response.data);

      // Add new conversation to list and select it
      setConversations((prev) => [response.data, ...prev]);
      setSelectedConversation(response.data);
      fetchMessages(response.data.id);

      // Close the user selection modal
      setShowAddContactModal(false);

      // Focus the message input field when the conversation loads
      setTimeout(() => {
        const inputField = document.getElementById("message-input");
        if (inputField) {
          inputField.focus();
        }
      }, 100);
    } catch (error) {
      // console.error("Error creating conversation:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to start conversation",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
    fetchCurrentUser();
  }, []);

  // Set up polling for new messages and typing status
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      }
      fetchConversations();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [selectedConversation]);

  // Helper function to get proper profile image URL
  const getProfileImageUrl = (user) => {
    if (!user) return DEFAULT_AVATAR;

    // Check for the image field first (what the API actually returns)
    if (user.image && !user.image.includes("null")) {
      // Handle path properly for image field
      if (user.image.startsWith("/media/")) {
        return `${IMG_BASE_URL}${user.image}`;
      } else if (user.image.startsWith("/")) {
        return `${IMG_BASE_URL}/media${user.image}`;
      }
      return user.image;
    }

    // Check profile_picture field with proper path handling
    if (user.profile_picture && !user.profile_picture.includes("null")) {
      if (user.profile_picture.startsWith("/media/")) {
        return `${IMG_BASE_URL}${user.profile_picture}`;
      } else if (user.profile_picture.startsWith("/")) {
        return `${IMG_BASE_URL}/media${user.profile_picture}`;
      }
      return user.profile_picture;
    }

    // Check profile_image field with proper path handling
    if (user.profile_image && !user.profile_image.includes("null")) {
      if (user.profile_image.startsWith("/media/")) {
        return `${IMG_BASE_URL}${user.profile_image}`;
      } else if (user.profile_image.startsWith("/")) {
        return `${IMG_BASE_URL}/media${user.profile_image}`;
      }
      return user.profile_image;
    }

    return DEFAULT_AVATAR;
  };

  // Helper to get proper display name
  const getUserDisplayName = (user) => {
    if (!user) return "Unknown User";

    // Check for 'name' field first (what the API actually returns)
    if (user.name && user.name.trim()) {
      return user.name;
    }

    // Check other fields as fallbacks
    if (user.full_name && user.full_name.trim()) {
      return user.full_name;
    }

    return user.username || "Unknown User";
  };

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? allUsers.filter((user) => {
        const fullName = user.full_name || "";
        const username = user.username || "";
        const searchLower = searchTerm.toLowerCase();

        return (
          fullName.toLowerCase().includes(searchLower) ||
          username.toLowerCase().includes(searchLower)
        );
      })
    : allUsers;

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="d-flex align-items-center text-muted mb-2 ps-5">
      <div className="typing-indicator">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="ms-2 small">typing...</span>
    </div>
  );

  // Add this useEffect to apply image loading fix after rendering
  useEffect(() => {
    // Fix all conversation avatars after rendering
    const avatars = document.querySelectorAll(".conversation-avatar");
    avatars.forEach((img) => {
      const realSrc = img.getAttribute("data-real-src");
      if (realSrc && realSrc !== DEFAULT_AVATAR) {
        // Create a new image to test if the real source loads
        const testImg = new Image();
        testImg.onload = () => {
          img.src = realSrc; // If it loads, use the real source
        };
        testImg.onerror = () => {
          img.src = DEFAULT_AVATAR; // If it fails, keep using default avatar
        };
        testImg.src = realSrc;
      }
    });
  }, [conversations]);

  // Add this useEffect to detect and track dark mode
  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark =
        document.body.classList.contains("dark-mode") ||
        (localStorage.getItem("appearanceSettings") &&
          JSON.parse(localStorage.getItem("appearanceSettings")).darkMode);
      setDarkMode(isDark);
    };

    checkDarkMode();

    // Add listener for dark mode changes
    const handleStorageChange = () => {
      checkDarkMode();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAttachMenu && !event.target.closest(".position-relative")) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showAttachMenu]);

  // Add resize event listener for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 700;
      setIsMobile(newIsMobile);
      
      // Reset conversation view when switching from mobile to desktop
      if (!newIsMobile && showConversationOnMobile) {
        setShowConversationOnMobile(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showConversationOnMobile]);

  // Then add this function to handle file downloads/opens
  const handleFileAction = (fileUrl, fileName) => {
    // Create a clean URL that doesn't expose backend structure
    const url = fileUrl.startsWith("http")
      ? fileUrl
      : `${API_BASE_URL}${fileUrl}`;

    // Open in new tab
    window.open(url, "_blank");
  };

  // Add this function to fix image URLs
  const getAttachmentUrl = (attachmentPath) => {
    if (!attachmentPath) return "";

    // Handle already full URLs
    if (attachmentPath.startsWith("http")) {
      return attachmentPath;
    }

    // Handle relative paths correctly
    return `${API_BASE_URL}${attachmentPath.startsWith("/") ? "" : "/"}${attachmentPath}`;
  };

  // Add this function to handle direct file downloads
  const downloadFile = (fileUrl, fileName) => {
    // Get the full URL
    const url = fileUrl.startsWith("http")
      ? fileUrl
      : `${API_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;

    // Create a temporary anchor element
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName || "download";
    document.body.appendChild(anchor);
    anchor.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(anchor);
    }, 100);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: darkMode ? "#121212" : "white",
      }}
    >
      {/* Sidebar - only show on non-mobile screens */}
      {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: !isMobile ? (sidebarCollapsed ? "80px" : "270px") : 0,
          transition: "margin-left 0.3s ease",
          backgroundColor: darkMode ? "#121212" : "white",
          color: darkMode ? "white" : "black",
        }}
      >
        {/* Header - Only show on desktop */}
        {!isMobile && (
          <Header
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
        )}

        {/* Messages Content - Adjust padding for mobile */}
        <Container fluid className={isMobile ? "p-0" : "py-4"}>
          {/* Add CSS for typing indicator */}
          <style jsx="true">{`
            .typing-indicator {
              display: inline-flex;
              align-items: center;
            }
            .typing-indicator .dot {
              display: inline-block;
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background-color: #6c757d;
              margin-right: 3px;
              animation: typing 1s infinite ease-in-out;
            }
            .typing-indicator .dot:nth-child(1) {
              animation-delay: 0s;
            }
            .typing-indicator .dot:nth-child(2) {
              animation-delay: 0.2s;
            }
            .typing-indicator .dot:nth-child(3) {
              animation-delay: 0.4s;
            }
            @keyframes typing {
              0%,
              60%,
              100% {
                transform: translateY(0);
              }
              30% {
                transform: translateY(-5px);
              }
            }

            /* iMessage styled bubbles */
            .message-bubble {
              position: relative;
              border-radius: 18px;
              padding: 8px 12px;
              width: auto; /* Auto width instead of max-width */
              margin-bottom: 0;
              white-space: pre-wrap; /* Changed from normal to pre-wrap */
              word-break: normal; /* Keep normal to prevent breaking in middle of words */
              overflow-wrap: normal; /* Changed from break-word to normal */
              display: inline-block;
              text-align: left;
              line-height: 1.4;
            }

            .sender-bubble {
              background-color: #0b84ff; /* iMessage blue */
              color: white;
              border-top-right-radius: 4px;
            }

            .receiver-bubble {
              background-color: ${darkMode ? "#2c2c2e" : "#e5e5ea"};
              color: ${darkMode ? "#ffffff" : "#212529"};
              border-top-left-radius: 4px;
              letter-spacing: normal;
              white-space: pre-wrap; /* Explicitly set for receiver bubbles */
              word-break: normal; /* Explicitly set for receiver bubbles */
            }

            /* Message container */
            .message-container {
              display: flex;
              flex-direction: column;
              margin-bottom: 10px;
              max-width: 75%;
              word-wrap: normal;
            }

            /* Message info row below bubble */
            .message-info {
              display: flex;
              align-items: center;
              margin-top: 2px;
              font-size: 0.7rem;
              color: ${darkMode ? "#aaaaaa" : "#8e8e93"};
              padding: 0 4px;
            }

            .sender-info {
              justify-content: flex-end;
            }

            .message-time {
              margin-right: 4px;
            }
            .dark-mode .list-group-item {
              background-color: #2c2c2e !important;
              color: white !important;
            }

            .dark-mode .list-group-item.active {
              background-color: #0d6efd !important;
              border-color: #0d6efd !important;
              color: #fff !important;
            }

            .dark-mode .list-group-item:hover:not(.active) {
              background-color: #3c3c3e !important;
              color: #fff !important;
            }
            .message-status {
              display: flex;
              align-items: center;
              margin-left: 4px;
            }

            .status-pending {
              color: #8e8e93;
            }

            .status-delivered {
              color: #8e8e93;
            }

            .status-read {
              color: #0b84ff;
            }

            /* Background color for messages area */
            .messages-wrapper {
              background-color: ${darkMode ? "#1c1c1e" : "#f5f5f7"};
            }

            .attachment-menu-item {
              position: absolute;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
              transform: translateY(0);
              opacity: 0;
              pointer-events: none;
              transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            }

            .attachment-menu-item.show {
              opacity: 1;
              pointer-events: all;
            }

            .attachment-menu-item:nth-child(1).show {
              transform: translateY(-60px);
            }

            .attachment-menu-item:nth-child(2).show {
              transform: translateY(-110px);
            }

            .attachment-menu-item:nth-child(3).show {
              transform: translateY(-160px);
            }

            .attachment-item-label {
              position: absolute;
              background-color: rgba(0, 0, 0, 0.7);
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
              left: 50px;
              white-space: nowrap;
              opacity: 0;
              transition: opacity 0.2s;
            }

            .attachment-menu-item:hover .attachment-item-label {
              opacity: 1;
            }

            .file-attachment-preview {
              margin-bottom: 10px;
            }

            .file-card {
              background-color: ${darkMode ? "#1c1c1e" : "#eaeaea"};
              border-radius: 8px;
              padding: 10px;
              display: flex;
              align-items: center;
              margin-bottom: 8px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .file-icon {
              width: 40px;
              height: 40px;
              border-radius: 5px;
              background-color: #094d90;
              color: white;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              margin-right: 12px;
              position: relative;
            }

            .file-type-icon {
              font-size: 16px;
              margin-bottom: 2px;
            }

            .file-extension {
              font-size: 7px;
              text-transform: uppercase;
              font-weight: bold;
            }

            .file-details {
              flex: 1;
              overflow: hidden;
            }

            .file-name {
              font-size: 14px;
              font-weight: 500;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              color: ${darkMode ? "#fff" : "#000"};
            }

            .file-size {
              font-size: 12px;
              color: ${darkMode ? "#aaa" : "#666"};
            }

            .image-preview {
              width: 40px;
              height: 40px;
              margin-right: 12px;
              border-radius: 5px;
              overflow: hidden;
            }

            .preview-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .remove-file-btn {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background-color: transparent;
              border: none;
              color: ${darkMode ? "#999" : "#666"};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              padding: 0;
              margin-left: 8px;
            }

            .remove-file-btn:hover {
              background-color: ${darkMode ? "#333" : "#ddd"};
            }

            .timestamp {
              font-size: 11px;
              color: ${darkMode ? "#aaa" : "#999"};
              text-align: right;
              margin-top: 2px;
            }

            .message-attachment-preview {
              margin-bottom: 5px;
              max-width: 100%;
            }

            .attachment-image-container {
              width: 100%;
              overflow: hidden;
            }

            .attachment-image {
              max-width: 200px;
              height: auto;
              border-radius: 8px;
              display: block;
            }

            .file-message-card {
              display: flex;
              align-items: center;
              background-color: ${darkMode ? "#333333" : "#f0f0f0"};
              border-radius: 8px;
              padding: 8px;
              margin-bottom: 5px;
            }

            .file-message-icon {
              width: 36px;
              height: 36px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background-color: #094d90;
              border-radius: 4px;
              margin-right: 8px;
              color: white;
            }

            .file-message-icon i {
              font-size: 14px;
              margin-bottom: 2px;
            }

            .file-message-ext {
              font-size: 6px;
              text-transform: uppercase;
              font-weight: bold;
            }

            .file-message-name {
              font-size: 12px;
              font-weight: 500;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 120px;
            }

            .attachment-image-container {
              position: relative;
              width: 100%;
              overflow: hidden;
              cursor: pointer;
            }

            .attachment-image-container:hover .image-overlay {
              opacity: 1;
            }

            .image-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transition: opacity 0.2s;
              border-radius: 8px;
            }

            .image-overlay i {
              color: white;
              font-size: 24px;
            }

            .file-action-btn {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: ${darkMode ? "#444" : "#e6e6e6"};
              border: none;
              color: ${darkMode ? "#fff" : "#333"};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              margin-left: 8px;
              transition: background-color 0.2s;
            }

            .file-action-btn:hover {
              background-color: ${darkMode ? "#666" : "#ccc"};
            }

            .file-message-name {
              font-size: 12px;
              font-weight: 500;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 120px;
              margin-right: 8px;
            }
            .file-action-buttons {
              display: flex;
              margin-left: 8px;
            }
            .file-action-buttons {
              display: flex;
              margin-left: 8px;
              opacity: 0;
              transition: opacity 0.2s ease;
            }

            .file-message-card:hover .file-action-buttons {
              opacity: 1;
            }

            .file-action-btn {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: ${darkMode ? "#444" : "#e6e6e6"};
              border: none;
              color: ${darkMode ? "#fff" : "#333"};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              margin-left: 4px;
              transition:
                background-color 0.2s,
                transform 0.1s;
            }

            .file-action-btn:hover {
              background-color: ${darkMode ? "#666" : "#ccc"};
              transform: scale(1.1);
            }
            .message-input-container {
              width: 100%;
              margin-top: 0;
            }

            .file-attachment-preview {
              width: 100%;
              margin-bottom: 12px;
            }

            /* Make the Form use flex column layout */
            .d-flex.flex-column {
              display: flex;
              flex-direction: column;
            }
          `}</style>

          {/* Conditional rendering based on mobile/desktop view */}
          {!isMobile ? (
            // Desktop view - show both columns
            <Row className="h-100">
              {/* Conversations List */}
              <Col md={4} lg={3} className="mb-4">
                <Card
                  className="h-100 shadow-sm"
                  style={{
                    backgroundColor: darkMode ? "#2c2c2e" : "white",
                    borderColor: darkMode ? "#444" : "#ddd",
                  }}
                >
                  <Card.Header
                    className="d-flex justify-content-between align-items-center text-white py-3"
                    style={{
                      backgroundColor: darkMode ? "#1c1c1e" : "#0d6efd",
                    }}
                  >
                    <h5 className="mb-0">Conversations</h5>
                    <Button
                      variant={darkMode ? "dark" : "light"}
                      size="sm"
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                      }}
                      onClick={() => {
                        setShowAddContactModal(true);
                        fetchAllUsers();
                      }}
                    >
                      <i className="fas fa-plus"></i>
                    </Button>
                  </Card.Header>
                  <Card.Body
                    className="p-0"
                    style={{
                      maxHeight: "70vh",
                      overflowY: "auto",
                      backgroundColor: darkMode ? "#2c2c2e" : "white",
                    }}
                  >
                    {loading && !conversations.length ? (
                      <div className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">
                          Loading conversations...
                        </p>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center p-4">
                        <i className="fas fa-comments fa-2x mb-3"></i>
                        <p style={{ color: darkMode ? "white" : "black" }}>
                          No conversations yet. Start a new one!
                        </p>
                      </div>
                    ) : (
                      <ul className="list-group list-group-flush">
                        {conversations.map((conversation) => {
                          // Extract other participant data safely with more debug logging
                          const otherUser = conversation.other_participant || {};
                          // console.log(
                          //   `Rendering conversation ${conversation.id}, otherUser:`,
                          //   otherUser
                          // );

                          // Use the name field from the API response
                          const displayName = otherUser?.name || "Unknown User";

                          const lastMessage = conversation.last_message || {};

                          return (
                            <li
                              key={conversation.id}
                              className={`list-group-item list-group-item-action d-flex align-items-center p-3 ${
                                selectedConversation?.id === conversation.id
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                handleConversationClick(conversation)
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <div className="position-relative">
                                <img
                                  src={getProfileImageUrl(otherUser)}
                                  alt={displayName}
                                  className="rounded-circle me-3"
                                  width="48"
                                  height="48"
                                  style={{ objectFit: "cover" }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = DEFAULT_AVATAR;
                                  }}
                                />
                                {conversation.unread_count > 0 && (
                                  <Badge
                                    bg="danger"
                                    pill
                                    className="position-absolute top-0 end-0"
                                  >
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex-grow-1 overflow-hidden">
                                <h6 className="mb-1 text-truncate">
                                  {displayName}
                                </h6>
                                {/* No need for separate username display since we're already using name */}
                                {lastMessage.content ? (
                                  <p className="mb-0 small text-truncate text">
                                    {lastMessage.content}
                                  </p>
                                ) : (
                                  <p className="mb-0 small text">
                                    No messages yet
                                  </p>
                                )}
                              </div>
                              {lastMessage.timestamp && (
                                <small className="text-muted ms-2">
                                  {new Date(
                                    lastMessage.timestamp
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </small>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Chat Area */}
              <Col md={8} lg={9}>
                <Card
                  className="h-100 shadow-sm"
                  style={{
                    backgroundColor: darkMode ? "#2c2c2e" : "white",
                    borderColor: darkMode ? "#444" : "#ddd",
                  }}
                >
                  {selectedConversation ? (
                    <>
                      {/* Chat Header */}
                      <Card.Header
                        className="d-flex justify-content-between align-items-center py-2"
                        style={{
                          backgroundColor: darkMode ? "#1c1c1e" : "#f8f9fa",
                          color: darkMode ? "white" : "black",
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <img
                            src={getProfileImageUrl(
                              selectedConversation.other_participant
                            )}
                            alt={
                              selectedConversation.other_participant?.username ||
                              "Unknown User"
                            }
                            className="rounded-circle me-2"
                            width="40"
                            height="40"
                            style={{ objectFit: "cover" }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_AVATAR;
                            }}
                          />
                          <div>
                            <h5 className="mb-0">
                              {getUserDisplayName(
                                selectedConversation.other_participant
                              )}
                            </h5>
                            {selectedConversation.other_participant?.username && (
                              <small className="text-muted">
                                @{selectedConversation.other_participant.username}
                              </small>
                            )}
                          </div>
                        </div>
                      </Card.Header>

                      {/* Messages */}
                      <Card.Body
                        className="p-3 messages-wrapper"
                        style={{ height: "60vh", overflowY: "auto" }}
                        ref={messageContainerRef}
                      >
                        {loading && !messages.length ? (
                          <div className="text-center p-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading messages...</p>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center p-5 text">
                            <i className="fas fa-paper-plane fa-3x mb-3"></i>
                            <p>
                              No messages yet. Send one to start the conversation!
                            </p>
                          </div>
                        ) : (
                          <>
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`d-flex ${
                                  message.is_sender
                                    ? "justify-content-end"
                                    : "justify-content-start"
                                } mb-2`}
                              >
                                {!message.is_sender && (
                                  <img
                                    src={getProfileImageUrl(
                                      selectedConversation.other_participant
                                    )}
                                    alt={
                                      selectedConversation.other_participant
                                        ?.username || "Unknown User"
                                    }
                                    className="rounded-circle me-2 align-self-start"
                                    width="32"
                                    height="32"
                                    style={{ objectFit: "cover" }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = DEFAULT_AVATAR;
                                    }}
                                  />
                                )}
                                <div
                                  className={`message-container ${message.is_sender ? "sender-container" : "receiver-container"}`}
                                >
                                  <div
                                    className={`message-bubble ${
                                      message.is_sender
                                        ? "sender-bubble"
                                        : "receiver-bubble"
                                    }`}
                                  >
                                    {/* Check if message has attachment and render preview - add this code */}
                                    {message.attachment && (
                                      <div className="message-attachment-preview mb-2">
                                        {message.attachment
                                          .toLowerCase()
                                          .match(
                                            /\.(jpeg|jpg|png|gif|webp|bmp)$/
                                          ) ? (
                                          // Image attachment preview with click-to-enlarge
                                          <div
                                            className="attachment-image-container"
                                            onClick={() =>
                                              setViewImage(
                                                getAttachmentUrl(
                                                  message.attachment
                                                )
                                              )
                                            }
                                          >
                                            <img
                                              src={getAttachmentUrl(
                                                message.attachment
                                              )}
                                              alt="Attachment"
                                              className="attachment-image"
                                              style={{
                                                maxWidth: "200px",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                              }}
                                            />
                                            <div className="image-overlay">
                                              <i className="fas fa-search-plus"></i>
                                            </div>
                                          </div>
                                        ) : (
                                          // File attachment preview with TWO buttons - open AND download
                                          <div className="file-message-card">
                                            <div className="file-message-icon">
                                              <i
                                                className={
                                                  message.attachment
                                                    .toLowerCase()
                                                    .endsWith(".pdf")
                                                    ? "fas fa-file-pdf"
                                                    : message.attachment
                                                          .toLowerCase()
                                                          .match(/\.(doc|docx)$/)
                                                      ? "fas fa-file-word"
                                                      : message.attachment
                                                            .toLowerCase()
                                                            .match(/\.(txt|rtf)$/)
                                                        ? "fas fa-file-alt"
                                                        : "fas fa-file"
                                                }
                                              ></i>
                                              <span className="file-message-ext">
                                                {message.attachment
                                                  .split(".")
                                                  .pop()
                                                  .toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="file-message-name">
                                              {message.attachment
                                                .split("/")
                                                .pop()}
                                            </div>
                                            <div className="file-action-buttons">
                                              <button
                                                className="file-action-btn"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleFileAction(
                                                    message.attachment,
                                                    message.attachment
                                                      .split("/")
                                                      .pop()
                                                  );
                                                }}
                                                aria-label="Open file"
                                                title="Open file"
                                              >
                                                <i className="fas fa-external-link-alt"></i>
                                              </button>
                                              <button
                                                className="file-action-btn"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  downloadFile(
                                                    message.attachment,
                                                    message.attachment
                                                      .split("/")
                                                      .pop()
                                                  );
                                                }}
                                                aria-label="Download file"
                                                title="Download file"
                                              >
                                                <i className="fas fa-download"></i>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Message content */}
                                    {message.content}
                                  </div>
                                  <div
                                    className={`message-info ${message.is_sender ? "sender-info" : ""}`}
                                  >
                                    <span className="message-time">
                                      {message.created_at
                                        ? new Date(
                                            message.created_at
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                                {message.is_sender && (
                                  <img
                                    src={
                                      getProfileImageUrl(currentUser) ||
                                      DEFAULT_AVATAR
                                    }
                                    alt={currentUser?.username || "You"}
                                    className="rounded-circle ms-2 align-self-start"
                                    width="32"
                                    height="32"
                                    style={{ objectFit: "cover" }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = DEFAULT_AVATAR;
                                    }}
                                  />
                                )}
                              </div>
                            ))}

                            {/* Typing indicator */}
                            {selectedConversation.typing_status && (
                              <TypingIndicator />
                            )}
                          </>
                        )}
                      </Card.Body>

                      {/* Message Input */}
                      <Card.Footer
                        className="p-3"
                        style={{
                          backgroundColor: darkMode ? "#2c2c2e" : "white",
                          borderTop: darkMode
                            ? "1px solid #444"
                            : "1px solid #ddd",
                        }}
                      >
                        {/* Fix the Form structure to separate file attachments from the input area */}
                        <Form
                          onSubmit={sendMessage}
                          className="d-flex flex-column" // Use flex column layout
                        >
                          {/* File preview - in a separate div above the input */}
                          {selectedFile && (
                            <div className="file-attachment-preview">
                              <div className="file-card">
                                {selectedFile.type.startsWith("image/") ? (
                                  <div className="image-preview">
                                    <img
                                      src={URL.createObjectURL(selectedFile)}
                                      alt={selectedFile.name}
                                      className="preview-image"
                                    />
                                  </div>
                                ) : (
                                  <div className="file-icon">
                                    <div className="file-type-icon">
                                      <i
                                        className={
                                          selectedFile.type.startsWith(
                                            "application/pdf"
                                          )
                                            ? "fas fa-file-pdf"
                                            : selectedFile.name.match(
                                                  /\.(doc|docx)$/i
                                                )
                                              ? "fas fa-file-word"
                                              : selectedFile.name.match(
                                                    /\.(txt)$/i
                                                  )
                                                ? "fas fa-file-alt"
                                                : "fas fa-file"
                                        }
                                      ></i>
                                    </div>
                                    <div className="file-extension">
                                      {selectedFile.name
                                        .split(".")
                                        .pop()
                                        .toUpperCase()}
                                    </div>
                                  </div>
                                )}

                                <div className="file-details">
                                  <div className="file-name">
                                    {selectedFile.name}
                                  </div>
                                  <div className="file-size">
                                    {selectedFile.size < 1024
                                      ? `${selectedFile.size} B`
                                      : selectedFile.size < 1024 * 1024
                                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                                        : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                                  </div>
                                </div>

                                <button
                                  type="button" 
                                  onClick={() => setSelectedFile(null)}
                                  className="remove-file-btn"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Input area with buttons in a separate div */}
                          <div className="message-input-container position-relative">
                            {/* Attachment button */}
                            <Button
                              type="button"
                              variant={darkMode ? "dark" : "primary"}
                              style={{
                                position: "absolute",
                                left: "5px",
                                top: "5px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(0,0,0,0)",
                                borderColor: "rgba(0,0,0,0)",
                                color: "rgb(2, 0, 125)",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                boxShadow: "none",
                                zIndex: 2,
                              }}
                              onClick={() => setShowAttachMenu(!showAttachMenu)}
                            >
                              <i className="fas fa-paperclip" style={{ fontSize: "14px" }}></i>
                            </Button>

                            {/* Text input */}
                            <Form.Control
                              id="message-input"
                              type="text"
                              value={newMessage}
                              onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                              }}
                              placeholder="Type your message..."
                              aria-label="Type your message"
                              style={{
                                backgroundColor: "white",
                                color: "black",
                                borderColor: darkMode ? "#555" : "#ced4da",
                                borderRadius: "24px",
                                paddingRight: "50px",
                                paddingLeft: "50px",
                                height: "46px",
                              }}
                            />

                            {/* Send button */}
                            <Button
                              type="submit"
                              variant={darkMode ? "dark" : "primary"}
                              disabled={!newMessage.trim() && !selectedFile}
                              style={{
                                position: "absolute",
                                right: "5px",
                                top: "5px",
                                zIndex: 10,
                                borderRadius: "50%",
                                backgroundColor: "rgba(0,0,0,0)",
                                borderColor: "rgba(0,0,0,0)",
                                color: "rgb(2, 0, 125)",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                boxShadow: "none",
                              }}
                            >
                              <i className="fas fa-paper-plane" style={{ fontSize: "14px" }}></i>
                            </Button>

                            {/* Attachment menu */}
                            <div className="attachment-menu">
                              <div
                                className={`attachment-menu-item ${showAttachMenu ? "show" : ""}`}
                                style={{ backgroundColor: "#0b84ff", bottom:"20px"}}
                                onClick={() => {
                                  if (imageInputRef.current)
                                    imageInputRef.current.click();
                                  setShowAttachMenu(false);
                                }}
                              >
                                <i className="fas fa-image"></i>
                                <span className="attachment-item-label">Image</span>
                                <input
                                  type="file"
                                  ref={imageInputRef}
                                  style={{ display: "none" }}
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                />
                              </div>

                              <div
                                className={`attachment-menu-item ${showAttachMenu ? "show" : ""}`}
                                style={{ backgroundColor: "#28a745",bottom:"20px" }}
                                onClick={() => {
                                  if (documentInputRef.current)
                                    documentInputRef.current.click();
                                  setShowAttachMenu(false);
                                }}
                              >
                                <i className="fas fa-file-alt"></i>
                                <span className="attachment-item-label">
                                  Document
                                </span>
                                <input
                                  type="file"
                                  ref={documentInputRef}
                                  style={{ display: "none" }}
                                  accept=".pdf,.doc,.docx,.txt,.rtf"
                                  onChange={handleDocumentUpload}
                                />
                              </div>

                              <div
                                className={`attachment-menu-item ${showAttachMenu ? "show" : ""}`}
                                style={{ backgroundColor: "#ffc107", bottom:"20px" }}
                                onClick={() => {
                                  if (fileInputRef.current)
                                    fileInputRef.current.click();
                                  setShowAttachMenu(false);
                                }}
                              >
                                <i className="fas fa-file"></i>
                                <span className="attachment-item-label">
                                  Any File
                                </span>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  style={{ display: "none" }}
                                  onChange={handleFileUpload}
                                />
                              </div>
                            </div>
                          </div>
                        </Form>
                      </Card.Footer>
                    </>
                  ) : (
                    <Card.Body
                      className="text-center p-5"
                      style={{
                        backgroundColor: darkMode ? "#2c2c2e" : "white",
                        color: darkMode ? "white" : "black",
                      }}
                    >
                      <i className="fas fa-comments fa-4x text mb-3"></i>

                      <p className="text mb-4">
                        Select a conversation or start a new one to begin
                        chatting.
                      </p>
                      <Button
                        variant={darkMode ? "dark" : "primary"}
                        onClick={() => {
                          setShowAddContactModal(true);
                          fetchAllUsers();
                        }}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Start a New Conversation
                      </Button>
                    </Card.Body>
                  )}
                </Card>
              </Col>
            </Row>
          ) : (
            // Mobile view - show either conversations list or chat area
            <div className="h-100">
              {!showConversationOnMobile || !selectedConversation ? (
                // Conversations list view for mobile
                <Card
                  className="h-100 shadow-sm mb-0" // Changed from mb-4 to mb-0
                  style={{
                    backgroundColor: darkMode ? "#2c2c2e" : "white",
                    borderColor: darkMode ? "#444" : "#ddd",
                    borderRadius: 0, // Remove border radius on mobile
                  }}
                >
                  <Card.Header
                    className="d-flex justify-content-between align-items-center text-white py-3"
                    style={{
                      backgroundColor: darkMode ? "#1c1c1e" : "#0d6efd",
                    }}
                  >
                    <h5 className="mb-0">Conversations</h5>
                    <Button
                      variant={darkMode ? "dark" : "light"}
                      size="sm"
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                      }}
                      onClick={() => {
                        setShowAddContactModal(true);
                        fetchAllUsers();
                      }}
                    >
                      <i className="fas fa-plus"></i>
                    </Button>
                  </Card.Header>
                  <Card.Body
                    className="p-0"
                    style={{
                      height: "calc(100vh - 200px)",
                      overflowY: "auto",
                      backgroundColor: darkMode ? "#2c2c2e" : "white",
                    }}
                  >
                    {loading && !conversations.length ? (
                      <div className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">
                          Loading conversations...
                        </p>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center p-4">
                        <i className="fas fa-comments fa-2x mb-3"></i>
                        <p style={{ color: darkMode ? "white" : "black" }}>
                          No conversations yet. Start a new one!
                        </p>
                      </div>
                    ) : (
                      <ul className="list-group list-group-flush">
                        {conversations.map((conversation) => {
                          // Extract other participant data
                          const otherUser = conversation.other_participant || {};
                          const displayName = otherUser?.name || "Unknown User";
                          const lastMessage = conversation.last_message || {};

                          return (
                            <li
                              key={conversation.id}
                              className={`list-group-item list-group-item-action d-flex align-items-center p-3 ${
                                selectedConversation?.id === conversation.id
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                handleConversationClick(conversation)
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <div className="position-relative">
                                <img
                                  src={getProfileImageUrl(otherUser)}
                                  alt={displayName}
                                  className="rounded-circle me-3"
                                  width="48"
                                  height="48"
                                  style={{ objectFit: "cover" }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = DEFAULT_AVATAR;
                                  }}
                                />
                                {conversation.unread_count > 0 && (
                                  <Badge
                                    bg="danger"
                                    pill
                                    className="position-absolute top-0 end-0"
                                  >
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex-grow-1 overflow-hidden">
                                <h6 className="mb-1 text-truncate">
                                  {displayName}
                                </h6>
                                {lastMessage.content ? (
                                  <p className="mb-0 small text-truncate text">
                                    {lastMessage.content}
                                  </p>
                                ) : (
                                  <p className="mb-0 small text">
                                    No messages yet
                                  </p>
                                )}
                              </div>
                              {lastMessage.timestamp && (
                                <small className="text-muted ms-2">
                                  {new Date(
                                    lastMessage.timestamp
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </small>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Card.Body>
                </Card>
              ) : (
                // Conversation view for mobile - MODIFIED VERSION
                <Card
                  className="h-100 shadow-sm"
                  style={{
                    backgroundColor: darkMode ? "#2c2c2e" : "white",
                    borderColor: darkMode ? "#444" : "#ddd",
                    // Move up by 20px to provide more space at bottom
                    marginBottom: "50px",
                  }}
                >
                  {/* Modified Chat Header with Better Back Button for mobile */}
                  <Card.Header
                    className="d-flex align-items-center py-2 position-relative"
                    style={{
                      backgroundColor: darkMode ? "#1c1c1e" : "#f8f9fa",
                      color: darkMode ? "white" : "black",
                    }}
                  >
                    {/* Transparent back button that spans the entire header width */}
                    <div
                      onClick={handleBackToContacts}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%", 
                        height: "100%",
                        zIndex: 1, // Ensure it's above other elements but below the content
                        cursor: "pointer",
                      }}
                    ></div>
                    
                    {/* Back arrow icon */}
                    <i 
                      className="fas fa-chevron-left me-3" 
                      style={{
                        fontSize: "16px",
                        color: darkMode ? "white" : "#0d6efd",
                        zIndex: 2, // Ensure it appears above the transparent overlay
                        position: "relative",
                      }}
                    ></i>

                    {/* User info - centered */}
                    <div className="d-flex align-items-center mx-auto" style={{ zIndex: 2 }}>
                      <img
                        src={getProfileImageUrl(
                          selectedConversation.other_participant
                        )}
                        alt={
                          selectedConversation.other_participant?.username ||
                          "Unknown User"
                        }
                        className="rounded-circle me-2"
                        width="40"
                        height="40"
                        style={{ objectFit: "cover" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_AVATAR;
                        }}
                      />
                      <div>
                        <h5 className="mb-0">
                          {getUserDisplayName(
                            selectedConversation.other_participant
                          )}
                        </h5>
                        {selectedConversation.other_participant?.username && (
                          <small className="text-muted">
                            @{selectedConversation.other_participant.username}
                          </small>
                        )}
                      </div>
                    </div>
                  </Card.Header>

                  {/* Messages - adjust height to account for mobile nav */}
                  <Card.Body
                    className="p-3 messages-wrapper"
                    style={{ 
                      height: "calc(100vh - 220px)", // Adjusted height to make room for nav bar 
                      overflowY: "auto" 
                    }}
                    ref={messageContainerRef}
                  >
                    {loading && !messages.length ? (
                      <div className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center p-5 text">
                        <i className="fas fa-paper-plane fa-3x mb-3"></i>
                        <p>
                          No messages yet. Send one to start the conversation!
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`d-flex ${
                              message.is_sender
                                ? "justify-content-end"
                                : "justify-content-start"
                            } mb-2`}
                          >
                            {!message.is_sender && (
                              <img
                                src={getProfileImageUrl(
                                  selectedConversation.other_participant
                                )}
                                alt={
                                  selectedConversation.other_participant
                                    ?.username || "Unknown User"
                                }
                                className="rounded-circle me-2 align-self-start"
                                width="32"
                                height="32"
                                style={{ objectFit: "cover" }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = DEFAULT_AVATAR;
                                }}
                              />
                            )}
                            <div
                              className={`message-container ${message.is_sender ? "sender-container" : "receiver-container"}`}
                            >
                              <div
                                className={`message-bubble ${
                                  message.is_sender
                                    ? "sender-bubble"
                                    : "receiver-bubble"
                                }`}
                              >
                                {/* Check if message has attachment and render preview - add this code */}
                                {message.attachment && (
                                  <div className="message-attachment-preview mb-2">
                                    {message.attachment
                                      .toLowerCase()
                                      .match(
                                        /\.(jpeg|jpg|png|gif|webp|bmp)$/
                                      ) ? (
                                      // Image attachment preview with click-to-enlarge
                                      <div
                                        className="attachment-image-container"
                                        onClick={() =>
                                          setViewImage(
                                            getAttachmentUrl(
                                              message.attachment
                                            )
                                          )
                                        }
                                      >
                                        <img
                                          src={getAttachmentUrl(
                                            message.attachment
                                          )}
                                          alt="Attachment"
                                          className="attachment-image"
                                          style={{
                                            maxWidth: "200px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                          }}
                                        />
                                        <div className="image-overlay">
                                          <i className="fas fa-search-plus"></i>
                                        </div>
                                      </div>
                                    ) : (
                                      // File attachment preview with TWO buttons - open AND download
                                      <div className="file-message-card">
                                        <div className="file-message-icon">
                                          <i
                                            className={
                                              message.attachment
                                                .toLowerCase()
                                                .endsWith(".pdf")
                                                ? "fas fa-file-pdf"
                                                : message.attachment
                                                      .toLowerCase()
                                                      .match(/\.(doc|docx)$/)
                                                  ? "fas fa-file-word"
                                                  : message.attachment
                                                        .toLowerCase()
                                                        .match(/\.(txt|rtf)$/)
                                                    ? "fas fa-file-alt"
                                                    : "fas fa-file"
                                            }
                                          ></i>
                                          <span className="file-message-ext">
                                            {message.attachment
                                              .split(".")
                                              .pop()
                                              .toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="file-message-name">
                                          {message.attachment
                                            .split("/")
                                            .pop()}
                                        </div>
                                        <div className="file-action-buttons">
                                          <button
                                            className="file-action-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleFileAction(
                                                message.attachment,
                                                message.attachment
                                                  .split("/")
                                                  .pop()
                                              );
                                            }}
                                            aria-label="Open file"
                                            title="Open file"
                                          >
                                            <i className="fas fa-external-link-alt"></i>
                                          </button>
                                          <button
                                            className="file-action-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadFile(
                                                message.attachment,
                                                message.attachment
                                                  .split("/")
                                                  .pop()
                                              );
                                            }}
                                            aria-label="Download file"
                                            title="Download file"
                                          >
                                            <i className="fas fa-download"></i>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Message content */}
                                {message.content}
                              </div>
                              <div
                                className={`message-info ${message.is_sender ? "sender-info" : ""}`}
                              >
                                <span className="message-time">
                                  {message.created_at
                                    ? new Date(
                                        message.created_at
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>
                              </div>
                            </div>
                            {message.is_sender && (
                              <img
                                src={
                                  getProfileImageUrl(currentUser) ||
                                  DEFAULT_AVATAR
                                }
                                alt={currentUser?.username || "You"}
                                className="rounded-circle ms-2 align-self-start"
                                width="32"
                                height="32"
                                style={{ objectFit: "cover" }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = DEFAULT_AVATAR;
                                }}
                              />
                            )}
                          </div>
                        ))}

                        {/* Typing indicator */}
                        {selectedConversation.typing_status && (
                          <TypingIndicator />
                        )}
                      </>
                    )}
                  </Card.Body>

                  {/* Message Input - keep existing code */}
                  <Card.Footer
                    className="p-3"
                    style={{
                      backgroundColor: darkMode ? "#2c2c2e" : "white",
                      borderTop: darkMode
                        ? "1px solid #444"
                        : "1px solid #ddd",
                    }}
                  >
                    {/* Fix the Form structure to separate file attachments from the input area */}
                    <Form
                      onSubmit={sendMessage}
                      className="d-flex flex-column" // Use flex column layout
                    >
                      {/* File preview - in a separate div above the input */}
                      {selectedFile && (
                        <div className="file-attachment-preview">
                          <div className="file-card">
                            {selectedFile.type.startsWith("image/") ? (
                              <div className="image-preview">
                                <img
                                  src={URL.createObjectURL(selectedFile)}
                                  alt={selectedFile.name}
                                  className="preview-image"
                                />
                              </div>
                            ) : (
                              <div className="file-icon">
                                <div className="file-type-icon">
                                  <i
                                    className={
                                      selectedFile.type.startsWith(
                                        "application/pdf"
                                      )
                                        ? "fas fa-file-pdf"
                                        : selectedFile.name.match(
                                              /\.(doc|docx)$/i
                                            )
                                          ? "fas fa-file-word"
                                          : selectedFile.name.match(
                                                /\.(txt)$/i
                                              )
                                            ? "fas fa-file-alt"
                                            : "fas fa-file"
                                  }
                                  ></i>
                                </div>
                                <div className="file-extension">
                                  {selectedFile.name
                                    .split(".")
                                    .pop()
                                    .toUpperCase()}
                                </div>
                              </div>
                            )}

                            <div className="file-details">
                              <div className="file-name">
                                {selectedFile.name}
                              </div>
                              <div className="file-size">
                                {selectedFile.size < 1024
                                  ? `${selectedFile.size} B`
                                  : selectedFile.size < 1024 * 1024
                                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                                    : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                              </div>
                            </div>

                            <button
                              type="button" 
                              onClick={() => setSelectedFile(null)}
                              className="remove-file-btn"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Input area with buttons in a separate div */}
                      <div className="message-input-container position-relative">
                        {/* Attachment button */}
                        <Button
                          type="button"
                          variant={darkMode ? "dark" : "primary"}
                          style={{
                            position: "absolute",
                            left: "5px",
                            top: "5px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(0,0,0,0)",
                            borderColor: "rgba(0,0,0,0)",
                            color: "rgb(2, 0, 125)",
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            boxShadow: "none",
                            zIndex: 2,
                          }}
                          onClick={() => setShowAttachMenu(!showAttachMenu)}
                        >
                          <i className="fas fa-paperclip" style={{ fontSize: "14px" }}></i>
                        </Button>

                        {/* Text input */}
                        <Form.Control
                          id="message-input"
                          type="text"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          placeholder="Type your message..."
                          aria-label="Type your message"
                          style={{
                            backgroundColor: "white",
                            color: "black",
                            borderColor: darkMode ? "#555" : "#ced4da",
                            borderRadius: "24px",
                            paddingRight: "50px",
                            paddingLeft: "50px",
                            height: "46px",
                          }}
                        />

                        {/* Send button */}
                        <Button
                          type="submit"
                          variant={darkMode ? "dark" : "primary"}
                          disabled={!newMessage.trim() && !selectedFile}
                          style={{
                            position: "absolute",
                            right: "5px",
                            top: "5px",
                            zIndex: 10,
                            borderRadius: "50%",
                            backgroundColor: "rgba(0,0,0,0)",
                            borderColor: "rgba(0,0,0,0)",
                            color: "rgb(2, 0, 125)",
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            boxShadow: "none",
                          }}
                        >
                          <i className="fas fa-paper-plane" style={{ fontSize: "14px" }}></i>
                        </Button>

                        {/* Attachment menu */}
                        <div className="attachment-menu">
                          <div
                            className={`attachment-menu-item ${showAttachMenu ? "show" : ""}`}
                            style={{ backgroundColor: "#0b84ff", bottom:"20px"}}
                            onClick={() => {
                              if (imageInputRef.current)
                                imageInputRef.current.click();
                              setShowAttachMenu(false);
                            }}
                          >
                            <i className="fas fa-image"></i>
                            <span className="attachment-item-label">Image</span>
                            <input
                              type="file"
                              ref={imageInputRef}
                              style={{ display: "none" }}
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </div>

                          <div
                            className={`attachment-menu-item ${showAttachMenu ? "show" : ""}`}
                            style={{ backgroundColor: "#28a745",bottom:"20px" }}
                            onClick={() => {
                              if (documentInputRef.current)
                                documentInputRef.current.click();
                              setShowAttachMenu(false);
                            }}
                          >
                            <i className="fas fa-file-alt"></i>
                            <span className="attachment-item-label">
                              Document
                            </span>
                            <input
                              type="file"
                              ref={documentInputRef}
                              style={{ display: "none" }}
                              accept=".pdf,.doc,.docx,.txt,.rtf"
                              onChange={handleDocumentUpload}
                            />
                          </div>

                          <div
                            className={`attachment-menu-item ${showAttachMenu ? "show" : ""}`}
                            style={{ backgroundColor: "#ffc107", bottom:"20px" }}
                            onClick={() => {
                              if (fileInputRef.current)
                                fileInputRef.current.click();
                              setShowAttachMenu(false);
                            }}
                          >
                            <i className="fas fa-file"></i>
                            <span className="attachment-item-label">
                              Any File
                            </span>
                            <input
                              type="file"
                              ref={fileInputRef}
                              style={{ display: "none" }}
                              onChange={handleFileUpload}
                            />
                          </div>
                        </div>
                      </div>
                    </Form>
                  </Card.Footer>
                </Card>
              )}
            </div>
          )}

          {/* Add Contact Modal */}
          <Modal
            show={showAddContactModal}
            onHide={() => setShowAddContactModal(false)}
            size="lg"
            contentClassName={darkMode ? "bg-dark text-light" : ""}
          >
            <Modal.Header
              style={{
                backgroundColor: darkMode ? "#2c2c2e" : "white",
                borderBottom: darkMode ? "1px solid #444" : "1px solid #dee2e6",
                color: darkMode ? "white" : "black",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Modal.Title>Start New Conversation</Modal.Title>
              <button
                onClick={() => setShowAddContactModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.2rem",
                  padding: "0.25rem 0.5rem",
                  cursor: "pointer",
                  color: darkMode ? "#fff" : "#212529",
                  transition: "color 0.15s ease-in-out",
                }}
                aria-label="Close"
                className="custom-close-button"
                onMouseOver={(e) =>
                  (e.currentTarget.style.color = darkMode ? "#999" : "#666")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.color = darkMode ? "#fff" : "#212529")
                }
              >
                &#x2715;
              </button>
            </Modal.Header>
            <Modal.Body
              style={{ backgroundColor: darkMode ? "#2c2c2e" : "white" }}
            >
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    backgroundColor: darkMode ? "#3c3c3e" : "white",
                    color: darkMode ? "white" : "black",
                    borderColor: darkMode ? "#555" : "#ced4da",
                  }}
                />
              </Form.Group>

              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {filteredUsers.length > 0 ? (
                  <ul className="list-group">
                    {filteredUsers.map((user) => (
                      <li
                        key={user.user_id}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleUserSelect(user)}
                      >
                        <img
                          src={getProfileImageUrl(user)}
                          alt={user.username || "User"}
                          className="rounded-circle me-3"
                          width="48"
                          height="48"
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_AVATAR;
                          }}
                        />
                        <div>
                          <h6 className="mb-0">
                            {user.full_name || user.username}
                          </h6>
                          <small className="text">@{user.username}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : searchTerm ? (
                  <p className="text-center text-muted">
                    No users found matching "{searchTerm}"
                  </p>
                ) : loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <p className="mt-2 text-muted">Loading users...</p>
                  </div>
                ) : (
                  <p className="text-center text-muted">No users available</p>
                )}
              </div>
            </Modal.Body>
          </Modal>

          {/* Image Viewer Modal */}
          <Modal
            show={viewImage !== null}
            onHide={() => setViewImage(null)}
            size="xl"
            centered
            contentClassName={darkMode ? "bg-dark" : ""}
          >
            <Modal.Header
              style={{
                backgroundColor: darkMode ? "#1c1c1e" : "white",
                borderBottom: darkMode ? "1px solid #444" : "1px solid #dee2e6",
                color: darkMode ? "white" : "black",
              }}
              closeButton
            >
              <Modal.Title>Image Preview</Modal.Title>
            </Modal.Header>
            <Modal.Body
              style={{
                backgroundColor: darkMode ? "#2c2e" : "white",
                padding: 0,
                textAlign: "center",
              }}
            >
              {viewImage && (
                <img
                  src={viewImage}
                  alt="Full size preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    margin: "0 auto",
                    display: "block",
                  }}
                />
              )}
            </Modal.Body>
            <Modal.Footer
              style={{
                backgroundColor: darkMode ? "#1c1c1e" : "white",
                borderTop: darkMode ? "1px solid #444" : "1px solid #dee2e6",
              }}
            >
              <Button variant="secondary" onClick={() => setViewImage(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  downloadFile(viewImage, viewImage.split("/").pop())
                }
              >
                Download
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>

      {/* Mobile Navigation (shown only on mobile devices) */}
      {isMobile && <MobileNav />}
    </div>
  );
};

// Add this component to your Messages.jsx file
const FileAttachmentPreview = ({ file, onRemove }) => {
  // Determine file type and icon
  const getFileIcon = () => {
    if (!file) return "fas fa-file";

    const fileType = file.type.split("/")[0];
    const extension = file.name.split(".").pop().toLowerCase();

    if (fileType === "image") return "fas fa-file-image";
    if (fileType === "video") return "fas fa-file-video";
    if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension))
      return "fas fa-file-alt";
    return "fas fa-file";
  };

  // Get readable file size
  const getFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get file extension for display
  const getFileExtension = () => {
    if (!file) return "";
    return file.name.split(".").pop().toUpperCase();
  };

  return (
    <div className="file-attachment-preview">
      {file && (
        <div className="file-card">
          {file.type.startsWith("image/") ? (
            // Image preview
            <div className="image-preview">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="preview-image"
              />
            </div>
          ) : (
            // Other file types
            <div className="file-icon">
              <div className="file-type-icon">
                <i className={getFileIcon()}></i>
              </div>
              <div className="file-extension">{getFileExtension()}</div>
            </div>
          )}

          <div className="file-details">
            <div className="file-name">{file.name}</div>
            <div className="file-size">{getFileSize(file.size)}</div>
          </div>

          <button
            onClick={onRemove}
            className="remove-file-btn"
            aria-label="Remove file"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

// Full-screen Image Viewer - Move this to the main component
const ImageViewer = ({ viewImage, setViewImage, darkMode }) => {
  if (viewImage === null) return null;

  return (
    <Modal
      show={true}
      onHide={() => setViewImage(null)}
      size="xl"
      centered
      contentClassName={darkMode ? "bg-dark" : ""}
    >
      <Modal.Header
        style={{
          backgroundColor: darkMode ? "#1c1c1e" : "white",
          borderBottom: darkMode ? "1px solid #444" : "1px solid #dee2e6",
          color: darkMode ? "white" : "black",
        }}
        closeButton
      >
        <Modal.Title>Image Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{
          backgroundColor: darkMode ? "#2c2c2e" : "white",
          padding: 0,
          textAlign: "center",
        }}
      >
        <img
          src={viewImage}
          alt="Full size preview"
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            margin: "0 auto",
            display: "block",
          }}
        />
      </Modal.Body>
      <Modal.Footer
        style={{
          backgroundColor: darkMode ? "#1c1c1e" : "white",
          borderTop: darkMode ? "1px solid #444" : "1px solid #dee2e6",
        }}
      >
        <Button
          variant={darkMode ? "dark" : "secondary"}
          onClick={() => setViewImage(null)}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => window.open(viewImage, "_blank")}
        >
          Open in New Tab
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Messages;
