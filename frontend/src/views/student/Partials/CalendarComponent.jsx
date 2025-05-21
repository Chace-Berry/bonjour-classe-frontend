import React, { useState, useEffect, useContext } from "react";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { API_BASE_URL } from "../../../utils/constants";
import useAxios from "../../../utils/useAxios";

export default function CalendarComponent() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [darkMode, setDarkMode] = useState(false); // Add state for dark mode
  const apiInstance = useAxios();

  // Fetch events from the API on page load
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiInstance.get(`${API_BASE_URL}events/`);
        setEvents(response.data); // Store the events from the API
      } catch (error) {
        console.error(" ");
      }
    };

    // Check if dark mode is enabled in localStorage or by user preference
    const checkDarkMode = () => {
      const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                         window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
    };

    fetchEvents();
    checkDarkMode();
  }, []);

  // Handle day click
  const handleDayClick = (date) => {
    const formattedDate = dayjs(date).format("YYYY-MM-DD");
    const dayEvents = events.filter((event) => event.event_date === formattedDate);
    setSelectedDate({ date: formattedDate, events: dayEvents });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StaticDatePicker
        displayStaticWrapperAs="desktop"
        value={selectedDate?.date || null}
        onChange={(newValue) => handleDayClick(newValue)}
        renderInput={(params) => <div {...params} />}
        renderDay={(day, _value, DayComponentProps) => {
          const formattedDate = day.format("YYYY-MM-DD");
          const isToday = day.isSame(dayjs(), "day");
          const hasEvent = events.some((event) => event.event_date === formattedDate);
          const isOutsideCurrentMonth = DayComponentProps.outsideCurrentMonth;

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
            bgcolor: darkMode ? "#333" : "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "8px",
          }}
        >
          <h3 style={{ textAlign: "center" }}>
            Schedule for {selectedDate?.date || ""}
          </h3>
          {selectedDate?.events?.length > 0 ? (
            <ul>
              {selectedDate.events.map((event, index) => (
                <li key={event.id || index} style={{ marginBottom: "10px" }}>
                  <strong>{event.name}</strong> - {event.event_time} <br />
                  Platform: {event.platform} <br />
                  <a href={event.invite_link} target="_blank" rel="noopener noreferrer">
                    Join Event
                  </a>
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