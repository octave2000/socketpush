import type { Messaging } from "firebase/messaging";
import { getMessagingInstance } from "../../firebase/firebase";

export const removeToken = async (
  messagingInstance?: Messaging
): Promise<boolean> => {
  try {
    const activeMessaging = messagingInstance || (await getMessagingInstance());
    const { deleteToken } = await import("firebase/messaging");
    const result = await deleteToken(activeMessaging);
    return result;
  } catch (error) {
    throw error;
  }
};
