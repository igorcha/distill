import client from "./client";

export function sendContactMessage(data: { name: string; email: string; subject: string; message: string }) {
  return client.post("/contact/", data);
}
