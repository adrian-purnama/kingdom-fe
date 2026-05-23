import axios from "axios";

/** localStorage key — change only here if you rename the client storage key */
export const TEMPLATE_TOKEN_KEY = "template-token";
export const STUDENT_TOKEN_KEY = "student-token";

/**
 * Single place to change API origin (override with `VITE_API_BASE_URL` in `.env`).
 * @type {string}
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

/** Route paths (change here if backend routes move) */
export const paths = {
  authSendOtp: "/auth/send-otp",
  authRegister: "/auth/register",
  authLogin: "/auth/login",
  /** GET — requires Bearer; validates token + returns current user */
  authMe: "/auth/me",
  /** GET — same payload as `authMe` (alias for session checks) */
  authValidate: "/auth/validate",
  /** GET — public app name, logo, openRegister / openLogin */
  branding: "/branding",
  /** GET — Bearer + admin; discovered HTTP routes */
  adminRbacRoutes: "/admin/rbac/routes",
  /** GET — Bearer + admin; routes missing permissions + stale permission rows */
  adminRbacProblems: "/admin/rbac/problems",
  adminRbacPermissions: "/admin/rbac/permissions",
  /** GET list / POST create role (Bearer + admin) */
  adminRbacRoles: "/admin/rbac/roles",
  /** GET — Bearer + admin; users list with optional email search */
  adminUsers: "/admin/users",
  /** GET list | POST create | GET/PATCH/DELETE :id — Bearer + admin; students */
  adminStudents: "/admin/students",
  /** POST multipart `file` — Bearer + admin; CSV bulk import */
  adminStudentsImportCsv: "/admin/students/import-csv",
  /** GET list | PATCH :id/points — Bearer + admin; housing scoreboard */
  adminHousing: "/admin/housing",
  /** GET — public; housing team scores */
  housingScores: "/housing/scores",
  /** GET | PATCH — Bearer + admin; app name, logo URL, openRegister, openLogin */
  adminApp: "/admin/app",
  /** POST multipart `file` — Bearer + admin; uploads logo to GridFS, sets `appLogo` */
  adminAppLogo: "/admin/app/logo",
  /** GET — public; search students by name */
  studentSearch: "/student/search",
  /** POST — public; student PIN login */
  studentLogin: "/student/login",
  /** GET — Bearer student JWT */
  studentMe: "/student/me",
  /** PATCH — Bearer student JWT; set gender + characterRole */
  studentCharacter: "/student/me/character",
};

export function getTemplateToken() {
  try {
    return localStorage.getItem(TEMPLATE_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Persist JWT / session token for authenticated requests */
export function setTemplateToken(token) {
  try {
    if (token) {
      localStorage.setItem(TEMPLATE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TEMPLATE_TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearTemplateToken() {
  setTemplateToken("");
}

export function getStudentToken() {
  try {
    return localStorage.getItem(STUDENT_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStudentToken(token) {
  try {
    if (token) {
      localStorage.setItem(STUDENT_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STUDENT_TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearStudentToken() {
  setStudentToken("");
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  validateStatus: () => true,
});

apiClient.interceptors.request.use((config) => {
  const token = getTemplateToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Normalizes backend `{ success, code, message, data }` and HTTP errors.
 * @param {import('axios').AxiosResponse} res
 */
function handleResponse(res) {
  const data = res.data;
  const httpOk = res.status >= 200 && res.status < 300;
  const bodyOk = data == null || data.success !== false;
  if (httpOk && bodyOk) {
    return data;
  }
  const message =
    typeof data?.message === "string" && data.message
      ? data.message
      : res.statusText || "Request failed";
  const err = new Error(message);
  err.status = res.status;
  err.code = data?.code;
  err.data = data?.data;
  err.response = res;
  throw err;
}

/**
 * GET — path is appended to `API_BASE_URL` (e.g. `/auth/profile`).
 * @param {string} path
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function apiGet(path, config) {
  const res = await apiClient.get(path, config);
  return handleResponse(res);
}

/**
 * POST JSON body.
 * @param {string} path
 * @param {unknown} [body]
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function apiPost(path, body, config) {
  const res = await apiClient.post(path, body, config);
  return handleResponse(res);
}

/**
 * POST `multipart/form-data` (e.g. file upload). Do not set `Content-Type` manually — boundary is set automatically.
 * @param {string} path
 * @param {FormData} formData
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function apiPostFormData(path, formData, config) {
  const res = await apiClient.post(path, formData, {
    ...config,
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData) {
          delete headers["Content-Type"];
        }
        return data;
      },
    ],
  });
  return handleResponse(res);
}

/**
 * PATCH JSON body.
 * @param {string} path
 * @param {unknown} [body]
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function apiPatch(path, body, config) {
  const res = await apiClient.patch(path, body, config);
  return handleResponse(res);
}

/**
 * DELETE resource.
 * @param {string} path
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function apiDelete(path, config) {
  const res = await apiClient.delete(path, config);
  return handleResponse(res);
}

const studentApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  validateStatus: () => true,
});

studentApiClient.interceptors.request.use((config) => {
  const token = getStudentToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  validateStatus: () => true,
});

/** Public student API (no auth). */
export async function apiGetPublic(path, config) {
  const res = await publicApiClient.get(path, config);
  return handleResponse(res);
}

export async function apiPostPublic(path, body, config) {
  const res = await publicApiClient.post(path, body, config);
  return handleResponse(res);
}

export async function apiGetStudent(path, config) {
  const res = await studentApiClient.get(path, config);
  return handleResponse(res);
}

export async function apiPostStudent(path, body, config) {
  const res = await studentApiClient.post(path, body, config);
  return handleResponse(res);
}

export async function apiPatchStudent(path, body, config) {
  const res = await studentApiClient.patch(path, body, config);
  return handleResponse(res);
}

/** Raw axios instance if you need custom verbs; prefer `apiGet` / `apiPost`. */
export { apiClient, studentApiClient };
