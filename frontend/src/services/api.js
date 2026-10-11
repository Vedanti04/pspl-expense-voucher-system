const BACKEND_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, "")}/api` : "/api";

export function getFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, "")}${path}` : path;
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("pspl_auth_token");
  const headers = { ...(options.headers || {}) };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  login: (email, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  getMe: () => apiRequest("/auth/me")
};

export const voucherApi = {
  getVouchers: (params = {}) => {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        query.append(key, val);
      }
    }
    const qStr = query.toString();
    return apiRequest(`/vouchers${qStr ? `?${qStr}` : ""}`);
  },

  getStats: () => apiRequest("/vouchers/dashboard"),

  getVoucherById: (id) => apiRequest(`/vouchers/${id}`),

  createVoucher: (data) =>
    apiRequest("/vouchers", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  updateVoucher: (id, data) =>
    apiRequest(`/vouchers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),

  deleteVoucher: (id) =>
    apiRequest(`/vouchers/${id}`, {
      method: "DELETE"
    }),

  uploadEmployeeSignature: (id, payload) => {
    if (payload instanceof FormData) {
      return apiRequest(`/vouchers/${id}/employee-signature`, {
        method: "POST",
        body: payload
      });
    }
    return apiRequest(`/vouchers/${id}/employee-signature`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  submitVoucher: (id, payload = {}) => {
    if (payload instanceof FormData) {
      return apiRequest(`/vouchers/${id}/submit`, {
        method: "POST",
        body: payload
      });
    }
    return apiRequest(`/vouchers/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  approveVoucher: (id, payload = {}) => {
    if (payload instanceof FormData) {
      return apiRequest(`/vouchers/${id}/approve`, {
        method: "POST",
        body: payload
      });
    }
    return apiRequest(`/vouchers/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  rejectVoucher: (id, reason) =>
    apiRequest(`/vouchers/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    })
};