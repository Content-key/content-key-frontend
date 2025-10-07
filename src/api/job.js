// src/api/jobs.js
import api from "./axios";

/**
 * Get jobs for creators with server-side geo filtering.
 * Supply current user coords and desired radiusMiles.
 * The backend enforces visibility/review rules.
 */
export const getJobsNearby = ({ lng, lat, radiusMiles }) =>
  api.get("/api/jobs", {
    params: { lng, lat, radiusMiles },
  }).then(r => r.data);

/**
 * Sponsor creates a job.
 * Backend will auto-stamp location from body lng/lat OR sponsor address fallback.
 * Passing radiusMiles > 150 should flag underReview server-side.
 */
export const createJob = ({
  title,
  description,
  budget,
  jobType,          // "local" | "upForGrabs"
  lng,              // optional if server will fallback
  lat,              // optional if server will fallback
  radiusMiles,      // optional (server default if omitted)
}) => {
  const body = {
    title,
    description,
    budget,
    jobType,
  };

  if (lng !== undefined && lat !== undefined) {
    body.lng = lng;
    body.lat = lat;
  }
  if (radiusMiles !== undefined) {
    body.radiusMiles = radiusMiles;
  }

  return api.post("/api/jobs", body).then(r => r.data);
};

/**
 * Update only the radiusMiles for a job.
 * Server re-checks the review rule when this changes.
 */
export const updateJobRadius = (jobId, radiusMiles) =>
  api.patch(`/api/jobs/${jobId}/radius`, { radiusMiles }).then(r => r.data);

/**
 * Update job location coordinates (admin/sponsor fix).
 */
export const updateJobLocation = (jobId, { lng, lat }) =>
  api.patch(`/api/jobs/${jobId}/location`, { lng, lat }).then(r => r.data);

/**
 * (Team) Fetch jobs flagged as underReview (radius > threshold).
 */
export const getUnderReviewJobs = () =>
  api.get("/api/jobs/review").then(r => r.data);

/**
 * Accept a job (creator action).
 */
export const acceptJob = (jobId) =>
  api.post(`/api/jobs/${jobId}/accept`).then(r => r.data);

/**
 * Submit one or more content links for a job.
 * links: array of { type: "YouTube"|"Facebook"|"Instagram"|"Other", url: string }
 */
export const submitContentLinks = (jobId, links) =>
  api.post(`/api/jobs/${jobId}/submit`, { links }).then(r => r.data);
