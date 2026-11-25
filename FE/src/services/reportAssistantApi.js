import { authRequest, tokenKey } from "./authApi.js";

export function improveDescription(description) {
  return authRequest("/api/ai/improve-description", {
    method: "POST",
    token: sessionStorage.getItem(tokenKey),
    body: JSON.stringify({ description }),
  });
}
