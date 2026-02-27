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
