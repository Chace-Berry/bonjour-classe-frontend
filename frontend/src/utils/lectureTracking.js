import useAxios from './useAxios';

/**
 * Track when a student completes a lecture
 * @param {number} lectureId - The ID of the completed lecture
 * @param {number} courseId - The ID of the course the lecture belongs to
 * @returns {Promise} - The response from the API
 */
export const trackLectureCompletion = async (lectureId, courseId) => {
  try {
    const api = useAxios();
    const response = await api.post('student/track-lecture-completion/', {
      lecture_id: lectureId,
      course_id: courseId
    });
    
    // console.log('Lecture completion tracked:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // console.error('Error tracking lecture completion:', error);
    return {
      success: false,
      error: error?.response?.data || 'Failed to track lecture completion'
    };
  }
};