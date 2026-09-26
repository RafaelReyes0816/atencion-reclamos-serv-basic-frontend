import api from '../api/client';

export const login = async (documento, password) => {
  const formData = new URLSearchParams();
  formData.append('username', documento);
  formData.append('password', password);
  const response = await api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};
