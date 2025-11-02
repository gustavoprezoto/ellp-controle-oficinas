import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const authAPI = {
  login: (email, password) => 
    axios.post(`${API_BASE_URL}/token`, { email, password }),
};

export const usersAPI = {
  getMe: () => axios.get(`${API_BASE_URL}/users/me`),
  create: (userData) => axios.post(`${API_BASE_URL}/users/`, userData),
  get: (userId) => axios.get(`${API_BASE_URL}/users/${userId}`),
};

export const workshopsAPI = {
  getAll: (publishedOnly = false) => 
    axios.get(`${API_BASE_URL}/workshops/?published_only=${publishedOnly}`),
  getMyWorkshops: () => axios.get(`${API_BASE_URL}/workshops/my-workshops`),
  get: (workshopId) => axios.get(`${API_BASE_URL}/workshops/${workshopId}`),
  create: (workshopData) => axios.post(`${API_BASE_URL}/workshops/`, workshopData),
  update: (workshopId, workshopData) => 
    axios.put(`${API_BASE_URL}/workshops/${workshopId}`, workshopData),
  enroll: (workshopId) => 
    axios.post(`${API_BASE_URL}/workshops/${workshopId}/enroll`),
  getStudents: (workshopId) => 
    axios.get(`${API_BASE_URL}/workshops/${workshopId}/students`),
};