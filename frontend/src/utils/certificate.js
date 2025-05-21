import axios from 'axios';
import useAxios from './useAxios'; 

// Fix: Remove the prefix from API_URL since useAxios already includes the base URL
const API_URL = 'certificates/';  // Without /api/v1/ prefix

// This function both fetches existing certificates and generates new ones when needed
export const getCertificates = async (studentId, courseId = null, completionDate = null) => {
    try {
        const api = useAxios();
        let url = `${API_URL}get/`;
        
        // Build query parameters
        const params = new URLSearchParams();
        if (studentId) {
            params.append('student_id', studentId);
        }
        if (courseId) {
            // IMPORTANT: Use the proper course_id format shown in the database (varchar)
            // The courseId parameter should already be in the correct format like "756625"
            params.append('course_id', courseId);
        }
        if (completionDate) {
            params.append('completion_date', completionDate);
        }
        
        // Add params to URL if any exist
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
        // console.log(`Fetching certificates from: ${url}`);
        
        const response = await api.get(url, {
            headers: {
                'Content-Type': 'application/json'
                // The Authorization header is automatically added by useAxios
            }
        });
        
        return response.data;
    } catch (error) {
        // console.error("Certificate fetch error:", error);
        throw new Error('Error fetching/generating certificate: ' + error.message);
    }
};

// Add this alias to support existing code
export const fetchCertificates = getCertificates;

// Get a specific certificate by ID
export const getCertificateById = async (certificateId, courseId = null) => {
    try {
        const api = useAxios();
        let url = `${API_URL}get/`;
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('certificate_id', certificateId);
        if (courseId) {
            params.append('course_id', courseId);
        }
        
        url += `?${params.toString()}`;
        
        // console.log(`Fetching certificate by ID: ${url}`);
        
        const response = await api.get(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        // console.error("Certificate fetch error:", error);
        throw new Error('Error fetching certificate: ' + error.message);
    }
};

// Simplified - just use getCertificates with a courseId
export const generateCertificate = async (courseId) => {
    return await getCertificates(null, courseId);
};

export const downloadCertificate = async (certificateId) => {
    try {
        const api = useAxios();
        const response = await api.get(`${API_URL}get/?certificate_id=${certificateId}&download=true`, {
            responseType: 'blob',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `certificate_${certificateId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        // console.error("Download error:", error);
        throw new Error('Error downloading certificate: ' + error.message);
    }
};

export const viewCertificate = async (certificateId) => {
    try {
        const api = useAxios();
        const response = await api.get(`${API_URL}get/${certificateId}/`);
        return response.data;
    } catch (error) {
        // console.error("View certificate error:", error);
        throw new Error('Error viewing certificate: ' + error.message);
    }
};