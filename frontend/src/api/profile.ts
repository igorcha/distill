import client from "./client";

export function getProfile() {
  return client.get("/auth/profile/");
}

export function updateMe(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
}) {
  return client.patch("/auth/me/", data);
}
