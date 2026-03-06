import client from "./client";

export function login(email: string, password: string) {
  return client.post("/auth/login/", { email, password });
}

export function register(
  email: string,
  password: string,
  first_name: string,
  last_name: string
) {
  return client.post("/auth/register/", {
    email,
    password,
    first_name,
    last_name,
  });
}

export function refreshToken() {
  const refresh = localStorage.getItem("refresh_token");
  return client.post("/auth/token/refresh/", { refresh });
}

export function getMe() {
  return client.get("/auth/me/");
}

export function forgotPassword(email: string) {
  return client.post("/auth/forgot-password/", { email });
}

export function resetPassword(uid: string, token: string, new_password: string) {
  return client.post("/auth/reset-password/", { uid, token, new_password });
}
