import api from "./client";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("afi_token", data.access_token);
  return data;
}

export async function register(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  localStorage.setItem("afi_user", JSON.stringify(data));
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("afi_token");
    localStorage.removeItem("afi_user");
  }
}
