import type { InternalPayload } from "../types";

export type HubSyncHttpClientOptions = {
  baseUrl?: string;
  appId?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
  throwOnError?: boolean;
};

export type HubSyncRequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type HubSyncApiError = Error & {
  status?: number;
  data?: unknown;
};

type Frequency = `${number}${"s" | "m" | "h" | "d" | "w"}`;

export type EventPayload = Record<string, any> & Partial<InternalPayload>;

export type ScheduleParams = {
  event: string;
  payload?: EventPayload;
  scheduled_at: string;
  frequency?: Frequency;
  repeat_until?: string;
};

export type HubSyncHttpClient = {
  baseUrl: string;
  request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    options?: HubSyncRequestOptions
  ): Promise<T>;

  event<T = any>(
    params: {
      app_uuid?: string;
      alias?: string;
      event: string;
      payload?: EventPayload;
    },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  eventAlias<T = any>(
    params: {
      app_uuid?: string;
      alias: string;
      event: string;
      payload?: EventPayload;
      queueIfOffline?: boolean;
    },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  eventApp<T = any>(
    params: { app_uuid?: string; event: string; payload?: EventPayload },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  eventRoom<T = any>(
    params: { room: string; event: string; payload?: EventPayload },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  topic<T = any>(
    params: { topic: string; event: string; payload?: EventPayload },
    options?: HubSyncRequestOptions
  ): Promise<T>;

  subscribe<T = any>(
    params: { app_uuid?: string; alias: string; topic: string },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  unsubscribe<T = any>(
    params: { app_uuid?: string; alias: string; topic: string },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  join<T = any>(
    params: { app_uuid?: string; alias: string; room: string },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  leave<T = any>(
    params: { app_uuid?: string; alias: string; room: string },
    options?: HubSyncRequestOptions
  ): Promise<T>;

  message<T = any>(
    params: {
      app_uuid?: string;
      alias?: string;
      room?: string;
      message: string;
      encrypted?: boolean;
      sender?: string;
    },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  messageAlias<T = any>(
    params: {
      app_uuid?: string;
      alias: string;
      message: string;
      encrypted?: boolean;
      sender?: string;
    },
    options?: HubSyncRequestOptions
  ): Promise<T>;
  messageRoom<T = any>(
    params: {
      room: string;
      message: string;
      encrypted?: boolean;
      sender?: string;
    },
    options?: HubSyncRequestOptions
  ): Promise<T>;

  onlineUsers<T = any>(
    app_uuid?: string,
    options?: HubSyncRequestOptions
  ): Promise<T>;
  onlineStatus<T = any>(
    app_uuid: string | undefined,
    alias: string,
    options?: HubSyncRequestOptions
  ): Promise<T>;
  disconnect<T = any>(
    params: { app_uuid?: string; alias: string },
    options?: HubSyncRequestOptions
  ): Promise<T>;

  scheduleAlias<T = any>(
    params: { app_uuid?: string; alias: string } & ScheduleParams,
    options?: HubSyncRequestOptions
  ): Promise<T>;
  scheduleRoom<T = any>(
    params: { app_uuid?: string; room: string } & ScheduleParams,
    options?: HubSyncRequestOptions
  ): Promise<T>;
  listSchedules<T = any>(
    app_uuid?: string,
    options?: HubSyncRequestOptions
  ): Promise<T>;
  deleteSchedule<T = any>(
    id: string,
    options?: HubSyncRequestOptions
  ): Promise<T>;
  undelivered<T = any>(
    app_uuid: string | undefined,
    alias: string,
    options?: HubSyncRequestOptions
  ): Promise<T>;

  verifyToken<T = any>(
    token: string,
    options?: HubSyncRequestOptions
  ): Promise<T>;
};

const defaultBaseUrl = "https://ylpv246y.eu1.hubfly.app";

function resolveBaseUrl(baseUrl?: string) {
  return (baseUrl || defaultBaseUrl).replace(/\/+$/, "");
}

function resolveAppId(options: HubSyncHttpClientOptions, app_uuid?: string) {
  const envAppId =
    process.env.NEXT_PUBLIC_SOCKET_APP ||
    process.env.SOCKET_APP_UUID ||
    process.env.HUBSYNC_APP_UUID;
  const resolved = app_uuid || options.appId || envAppId;
  if (!resolved) {
    throw new Error(
      "HubSync app_uuid is required. Pass app_uuid, or set appId in createHubSyncHttpClient, or set NEXT_PUBLIC_SOCKET_APP."
    );
  }
  return resolved;
}

function buildHeaders(
  options: HubSyncHttpClientOptions,
  requestOptions?: HubSyncRequestOptions,
  hasBody?: boolean
) {
  const headers: Record<string, string> = {
    ...(options.headers || {}),
    ...(requestOptions?.headers || {}),
  };

  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (options.apiKey && !headers.Authorization) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  return headers;
}

export function createHubSyncHttpClient(
  options: HubSyncHttpClientOptions = {}
): HubSyncHttpClient {
  const baseUrl = resolveBaseUrl(options.baseUrl);
  const throwOnError = options.throwOnError !== false;
  const fetcher = options.fetch || globalThis.fetch;

  if (!fetcher) {
    throw new Error(
      "fetch is not available in this environment. Provide options.fetch."
    );
  }

  async function request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    requestOptions?: HubSyncRequestOptions
  ): Promise<T> {
    const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const hasBody = body !== undefined;
    const headers = buildHeaders(options, requestOptions, hasBody);

    const res = await fetcher(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: requestOptions?.signal,
    });

    const text = await res.text();
    let data: unknown = undefined;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok && throwOnError) {
      const err: HubSyncApiError = new Error(
        `HubSync API ${method} ${path} failed (${res.status})`
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  return {
    baseUrl,
    request,

    event: (params, req) =>
      request(
        "POST",
        "/api/event",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    eventAlias: (params, req) =>
      request(
        "POST",
        "/api/event/alias",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    eventApp: (params, req) =>
      request(
        "POST",
        "/api/event/app",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    eventRoom: (params, req) => request("POST", "/api/event/room", params, req),
    topic: (params, req) => request("POST", "/api/topic", params, req),

    subscribe: (params, req) =>
      request(
        "POST",
        "/api/subscribe",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    unsubscribe: (params, req) =>
      request(
        "POST",
        "/api/unsubscribe",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    join: (params, req) =>
      request(
        "POST",
        "/api/join",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    leave: (params, req) =>
      request(
        "POST",
        "/api/leave",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),

    message: (params, req) =>
      request(
        "POST",
        "/api/message",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    messageAlias: (params, req) =>
      request(
        "POST",
        "/api/message/alias",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    messageRoom: (params, req) =>
      request("POST", "/api/message/room", params, req),

    onlineUsers: (app_uuid, req) =>
      request(
        "GET",
        `/api/online-users/${encodeURIComponent(
          resolveAppId(options, app_uuid)
        )}`,
        undefined,
        req
      ),
    onlineStatus: (app_uuid, alias, req) =>
      request(
        "GET",
        `/api/online-status/${encodeURIComponent(
          resolveAppId(options, app_uuid)
        )}/${encodeURIComponent(alias)}`,
        undefined,
        req
      ),
    disconnect: (params, req) =>
      request(
        "POST",
        "/api/disconnect",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),

    scheduleAlias: (params, req) =>
      request(
        "POST",
        "/api/schedule/alias",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    scheduleRoom: (params, req) =>
      request(
        "POST",
        "/api/schedule/room",
        {
          ...params,
          app_uuid: resolveAppId(options, params.app_uuid),
        },
        req
      ),
    listSchedules: (app_uuid, req) =>
      request(
        "GET",
        `/api/schedule/${encodeURIComponent(resolveAppId(options, app_uuid))}`,
        undefined,
        req
      ),
    deleteSchedule: (id, req) =>
      request(
        "DELETE",
        `/api/schedule/${encodeURIComponent(id)}`,
        undefined,
        req
      ),
    undelivered: (app_uuid, alias, req) =>
      request(
        "GET",
        `/api/undelivered/${encodeURIComponent(
          resolveAppId(options, app_uuid)
        )}/${encodeURIComponent(alias)}`,
        undefined,
        req
      ),

    verifyToken: (token, req) =>
      request("POST", "/api/verifyToken", { token }, req),
  };
}
