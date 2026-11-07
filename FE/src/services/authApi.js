const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const tokenKey = "vulnflow_token";

export async function authRequest(path, options = {}) {
  const { token, ...fetchOptions } = options;
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...fetchOptions,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}
