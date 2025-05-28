export const sendSPNotification = async (
  token: string,
  {
    title = "Notification Title",
    message = "You have a new message.",
    link,
    type = "default",
    data = {},
    actions,
  }: {
    title?: string;
    message?: string;
    link?: string;
    type?: string;
    data?: Record<string, any>;
    actions?: { action: string; title: string }[];
  } = {},
  api: string = "http://localhost:8000/send-notification"
) => {
  if (!token) return { success: false, message: "Missing token" };

  const payload = { token, title, message, link, type, data, actions };

  try {
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
