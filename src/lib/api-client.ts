let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch("/api/csrf");
  if (res.ok) {
    const { token } = await res.json();
    csrfToken = token;
    return token;
  }
  throw new Error("Failed to get CSRF token");
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const method = options.method?.toUpperCase() || "GET";
  const headers = new Headers(options.headers);

  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const token = await getCsrfToken();
    headers.set("x-csrf-token", token);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers, credentials: "same-origin" });
}

// Create-or-open a 1:1 chat room with another user. recipientId is the other
// person's PROFILE id (not their auth user id). Returns the room id, or null
// on failure. Used by every "Message"/"Chat" button so a conversation can
// actually be started (previously those buttons just linked to an empty
// /messages with no recipient).
export async function startConversation(recipientId: string): Promise<string | null> {
  try {
    const res = await apiFetch("/api/messages/rooms", {
      method: "POST",
      body: JSON.stringify({ recipientId }),
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function uploadFile(bucket: string, file: File) {
  const token = await getCsrfToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);

  return fetch("/api/upload", {
    method: "POST",
    headers: { "x-csrf-token": token },
    body: formData,
  });
}
