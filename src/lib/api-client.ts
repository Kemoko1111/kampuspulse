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
