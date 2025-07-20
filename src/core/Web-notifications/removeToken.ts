import { deleteToken, type Messaging } from "firebase/messaging";
import { messaging } from "../../firebase/firebase";

export const removeToken = async (
  messagingInstance: Messaging = messaging
): Promise<boolean> => {
  try {
    const result = await deleteToken(messagingInstance);
    return result;
  } catch (error) {
    throw error;
  }
};
