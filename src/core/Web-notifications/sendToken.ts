export const sendHubSyncNotification = async (
  token: string,
  {
    title = "Notification Title",
    message = "You have a new message.",
    body,
    icon,
    link,
    type = "default",
    data = {},
    actions,
  }: {
    title?: string;
    message?: string;
    body?: string;
    icon?: string;
    link?: string;
    type?: string;
    data?: Record<string, any>;
    actions?: { action: string; title: string }[];
  } = {},
  api: string = "https://distracted-feistel-3smkfr.eu1.hubfly.app/send-notification"
) => {
  if (!token) return { success: false, message: "Missing token" };

  const finalMessage = body || message;
  const payload = {
    token,
    title,
    message: finalMessage,
    body: finalMessage,
    icon,
    link,
    type,
    data,
    actions,
  };

  try {
    const res = await fetch(api, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SOCKET_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (json.success) {
      console.log("FCM notification sent successfully");
    } else {
      console.warn(
        "Server responded with failure:",
        json.message || json.error
      );
    }
    return { success: json.success, message: json.message || json.error };
  } catch (err) {
    console.error("Failed to send FCM notification to server", err);
    return { success: false, message: (err as Error).message };
  }
};

export const sendSPNotification = sendHubSyncNotification;
