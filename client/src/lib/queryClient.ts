import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const ADMIN_KEY_STORAGE = "adminKey";

// Adds the admin key to /api/admin calls; asks for it once if the server rejects it.
async function fetchWithAdminKey(url: string, init: RequestInit): Promise<Response> {
  if (!url.startsWith("/api/admin")) return fetch(url, init);

  const send = () => {
    const key = sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
    return fetch(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), "x-admin-key": key },
    });
  };

  let res = await send();
  if (res.status === 401) {
    const key = window.prompt("Admin password");
    if (key) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
      res = await send();
    }
  }
  return res;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetchWithAdminKey(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetchWithAdminKey(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
