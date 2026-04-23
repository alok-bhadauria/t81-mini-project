const BASE_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("sf_jwt");

const buildHeaders = (extra = {}) => {
    const token = getToken();
    const headers = { ...extra };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
};

const parseError = async (response) => {
    if (response.status === 429) {
        return new Error("Too many requests. Please wait a moment and try again.");
    }
    if (response.status === 401) {
        return new Error("SESSION_EXPIRED");
    }
    try {
        const body = await response.json();
        if (Array.isArray(body.detail)) return new Error(body.detail[0].msg);
        if (typeof body.detail === "string") return new Error(body.detail);
    } catch (_) {
        return new Error(`Request failed with status ${response.status}`);
    }
    return new Error(`Request failed with status ${response.status}`);
};

const request = async (method, path, options = {}) => {
    const { body, formBody, isFormData } = options;

    const headers = buildHeaders(
        isFormData
            ? {}
            : formBody
                ? { "Content-Type": "application/x-www-form-urlencoded" }
                : { "Content-Type": "application/json" }
    );

    const fetchOptions = { method, headers };

    if (body) fetchOptions.body = JSON.stringify(body);
    if (formBody) fetchOptions.body = formBody;
    if (isFormData) fetchOptions.body = isFormData;

    const response = await fetch(`${BASE_URL}${path}`, fetchOptions);

    if (!response.ok) {
        throw await parseError(response);
    }

    return response.json();
};

export const api = {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, { body }),
    postForm: (path, formBody) => request("POST", path, { formBody }),
    postMultipart: (path, formData) => request("POST", path, { isFormData: formData }),
    put: (path, body) => request("PUT", path, { body }),
    delete: (path) => request("DELETE", path),
};
