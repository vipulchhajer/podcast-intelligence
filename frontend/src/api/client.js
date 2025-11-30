/**
 * API client for Podcast Intelligence backend
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long-running operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Podcasts
export const addPodcast = async (rssUrl) => {
  const response = await apiClient.post('/api/podcasts', { rss_url: rssUrl });
  return response.data;
};

export const listPodcasts = async () => {
  const response = await apiClient.get('/api/podcasts');
  return response.data.podcasts;
};

export const getPodcastEpisodes = async (podcastId, limit = 20, offset = 0) => {
  const response = await apiClient.get(`/api/podcasts/${podcastId}/episodes`, {
    params: { limit, offset },
  });
  return response.data;
};

// Episodes
export const processEpisode = async (podcastId, episodeGuid) => {
  const response = await apiClient.post(
    `/api/podcasts/${podcastId}/episodes/process`,
    { episode_guid: episodeGuid }
  );
  return response.data;
};

export const getEpisode = async (episodeId) => {
  const response = await apiClient.get(`/api/episodes/${episodeId}`);
  return response.data;
};

export const listEpisodes = async (limit = 20, offset = 0, status = null) => {
  const response = await apiClient.get('/api/episodes', {
    params: { limit, offset, status },
  });
  return response.data;
};

// Email Capture
export const captureEmail = async (email) => {
  const response = await apiClient.post('/api/email-capture', { email });
  return response.data;
};

export default apiClient;



