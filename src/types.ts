type Frequency = `${number}${"s" | "m" | "h" | "d" | "w"}`;

export type InternalPayload = {
  scheduled_at?: string;
  frequency?: Frequency;
  repeat_until?: string;
};

export type OnlineStatusCallback = (data: {
  isOnline: boolean;
  user: string;
}) => void;
export type OnlineUsersCallback = (users: { alias: string }[]) => void;
export type deliveryCallback = ({
  alias,
  status,
  evtId,
  msgId,
}: {
  alias: string;
  status: string;
  msgId?: string;
  evtId?: string;
}) => void;
export type MessageCallback = ({
  message,
  encrypted,
  sender,
}: {
  message: string;
  encrypted: boolean;
  sender: string;
}) => void;
export type EventCallback<TPayload = Record<string, any>> = (eventData: {
  payload: TPayload & Partial<InternalPayload>;
  isRoom: boolean;
}) => void;

export type CallbacksRef = {
  onMessage: MessageCallback | null;
  onOnlineUsers: OnlineUsersCallback | null;
  onOnlineStatus: OnlineStatusCallback | null;
  onDelivery: deliveryCallback | null;
  customEvents: Map<string, EventCallback>;
};
