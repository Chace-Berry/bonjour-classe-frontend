import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { API_BASE_URL } from "../../../utils/constants";
import useAxios from "../../../utils/useAxios";
import { FaPencilAlt, FaTrash } from "react-icons/fa";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

export default function InstructorCalendarComponent(props) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiInstance = useAxios();

  // Fetch events from the API on page load
  useEffect(() => {
    fetchEvents();
    
    // Add this event listener to allow parent component to trigger a refresh
    window.addEventListener('calendar-refresh', fetchEvents);
    
    return () => {
      window.removeEventListener('calendar-refresh', fetchEvents);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await apiInstance.get(`${API_BASE_URL}events/`);
      setEvents(response.data); // Store the events from the API
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  // Handle day click
  const handleDayClick = (date) => {
    const formattedDate = dayjs(date).format("YYYY-MM-DD");
    const dayEvents = events.filter((event) => event.event_date === formattedDate); // Match events by event_date
    setSelectedDate({ date: formattedDate, events: dayEvents });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Update the handleEditClick function to ensure calendar refresh
  const handleEditClick = (eventId) => {
    setIsModalOpen(false);
    
    // Get the event data
    const eventToEdit = selectedDate?.events?.find(event => event.id === eventId);
    
    // Call the parent component's handleEditEvent function with the event ID
    if (props.handleEditEvent && eventId) {
      props.handleEditEvent(eventId);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = Cookies.get("access_token");
      
      const response = await apiInstance.delete(`events/${eventId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 204 || response.status === 200) {
        toast.success("Event deleted successfully");
        setIsModalOpen(false);
        
        // Refresh events list
        fetchEvents();
        
        // If parent component provided a refresh callback
        if (props.fetchDashboardData) {
          props.fetchDashboardData();
        }
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StaticDatePicker
        displayStaticWrapperAs="desktop"
        value={selectedDate?.date || null}
        onChange={(newValue) => handleDayClick(newValue)}
        renderInput={(params) => <div {...params} />} // Minimal renderInput
        renderDay={(day, _value, DayComponentProps) => {
          const formattedDate = day.format("YYYY-MM-DD");
          const isToday = day.isSame(dayjs(), "day"); // Check if the day is today
          const hasEvent = events.some((event) => event.event_date === formattedDate); // Check if the day has an event
          const isOutsideCurrentMonth = DayComponentProps.outsideCurrentMonth; // Check if the day is outside the current month

          // Filter out invalid props to avoid React warnings
          const {
            isAnimating,
            allowSameDateSelection,
            outsideCurrentMonth,
            disableHighlightToday,
            showDaysOutsideCurrentMonth,
            onDayFocus,
            onDaySelect,
            today,
            ...validProps
          } = DayComponentProps;
          return (
            <div
              {...validProps} // Spread only valid props
              key={formattedDate} // Ensure the key is passed directly
              style={{
                ...DayComponentProps.style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: hasEvent ? "#940303" : undefined, // Highlight days with events
                color: hasEvent ? "white": isOutsideCurrentMonth ? "#d3d3d3" : undefined,
                border: isToday ? "2px solid #032794" : undefined, // Add an outline for today
                borderRadius: "50%", // Make the outline a circle
                width: "36px", // Ensure consistent size
                height: "36px", // Ensure consistent size
                margin: "auto", // Center the circle within the cell
                cursor: "pointer", // Add pointer cursor for interactivity
              }}
              onClick={() => handleDayClick(day)} // Allow interaction with the day
            >
              {day.date()}
            </div>
          );
        }}
      />
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "8px",
          }}
        >
          <h3 style={{ textAlign: "center" }}>
            Schedule for {selectedDate?.date || ""}
          </h3>
          {selectedDate?.events?.length > 0 ? (
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {selectedDate.events.map((event, index) => (
                <li key={event.id || index} style={{ 
                    marginBottom: "10px",
                    padding: "10px", 
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px" 
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <strong>{event.name}</strong> <br />
                      <small>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small> <br />
                      {event.platform && event.platform !== 'other' && (
                        <small>Platform: {event.platform}</small>
                      )}
                      {event.invite_link && (
                        <div>
                          <a 
                            href={event.invite_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: "#0066cc", fontSize: "14px" }}
                          >
                            Join Event
                          </a>
                        </div>
                      )}
                    </div>
                    <div>
                      <Button 
                        onClick={() => handleEditClick(event.id)}
                        style={{ 
                          minWidth: "32px", 
                          padding: "4px 8px",
                          color: "#0066cc",
                          marginRight: "5px"
                        }}
                        title="Edit event"
                        disabled={isSubmitting}
                      >
                        <FaPencilAlt style={{ fontSize: "14px" }} />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteEvent(event.id)}
                        style={{ 
                          minWidth: "32px", 
                          padding: "4px 8px",
                          color: "#dc3545"
                        }}
                        title="Delete event"
                        disabled={isSubmitting}
                      >
                        <FaTrash style={{ fontSize: "14px" }} />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ textAlign: "center" }}>No events for this day.</p>
          )}
        </Box>
      </Modal>
    </LocalizationProvider>
  );
}