import { beforeEach, describe, expect, it, vi } from "vitest";

const socketMock = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock("./instance", () => ({
  getSocket: () => socketMock,
}));

import { hubsync } from "./wrappers";

describe("hubsync websocket wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes boolean ack responses for trigger", async () => {
    socketMock.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, ack: (value: boolean) => void) => {
        ack(true);
      }
    );

    await expect(
      hubsync.trigger({
        event: "order.updated",
        alias: "user-b",
        payload: { orderId: "o1" },
      })
    ).resolves.toEqual({
      success: true,
      message: "Event triggered successfully",
    });

    socketMock.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, ack: (value: boolean) => void) => {
        ack(false);
      }
    );

    await expect(
      hubsync.trigger({
        event: "order.updated",
        alias: "user-b",
      })
    ).resolves.toEqual({
      success: false,
      message: "Failed to trigger event",
    });
  });

  it("keeps object ack message for register/connect", async () => {
    socketMock.emit.mockImplementationOnce(
      (
        _event: string,
        _payload: unknown,
        ack: (value: { success: boolean; message: string }) => void
      ) => {
        ack({ success: false, message: "Unauthorized" });
      }
    );

    await expect(
      hubsync.connect({
        alias: "user-a",
        app_uuid: "my-app",
        token: "bad-token",
      })
    ).resolves.toEqual({
      success: false,
      message: "Unauthorized",
    });
  });

  it("attaches and detaches receiveMessage listener with ack", () => {
    let receiveMessageListener:
      | ((data: unknown, ack?: (value: unknown) => void) => void)
      | undefined;

    socketMock.on.mockImplementation((event: string, handler: any) => {
      if (event === "receiveMessage") {
        receiveMessageListener = handler;
      }
    });

    const callback = vi.fn();
    hubsync.onMessage(callback);

    const ack = vi.fn();
    receiveMessageListener?.(
      {
        message: "hello",
        encrypted: false,
        sender: "alice",
      },
      ack
    );

    expect(callback).toHaveBeenCalledWith({
      message: "hello",
      encrypted: false,
      sender: "alice",
    });
    expect(ack).toHaveBeenCalledWith({ ok: true });

    hubsync.offMessage(callback);
    expect(socketMock.off).toHaveBeenCalledWith(
      "receiveMessage",
      receiveMessageListener
    );
  });

  it("normalizes wrapped and raw custom event payloads", () => {
    let eventListener:
      | ((data: unknown, ack?: (value: unknown) => void) => void)
      | undefined;

    socketMock.on.mockImplementation((event: string, handler: any) => {
      if (event === "typing") {
        eventListener = handler;
      }
    });

    const callback = vi.fn();
    hubsync.onEvent("typing", callback);

    const wrappedAck = vi.fn();
    eventListener?.({ payload: { isTyping: true }, isRoom: true }, wrappedAck);
    expect(callback).toHaveBeenNthCalledWith(1, {
      payload: { isTyping: true },
      isRoom: true,
    });
    expect(wrappedAck).toHaveBeenCalledWith({ ok: true });

    const rawAck = vi.fn();
    eventListener?.({ isTyping: false }, rawAck);
    expect(callback).toHaveBeenNthCalledWith(2, {
      payload: { isTyping: false },
      isRoom: false,
    });
    expect(rawAck).toHaveBeenCalledWith({ ok: true });

    hubsync.offEvent("typing", callback);
    expect(socketMock.off).toHaveBeenCalledWith("typing", eventListener);
  });

  it("registers and removes status listener for online users", () => {
    let statusListener: (() => void) | undefined;

    socketMock.on.mockImplementation((event: string, handler: any) => {
      if (event === "status") {
        statusListener = handler;
      }
    });

    const usersCallback = vi.fn();
    hubsync.getOnlineUsers(usersCallback, "my-app");

    statusListener?.();
    expect(socketMock.emit).toHaveBeenCalledWith(
      "getOnlineUsers",
      { app_uuid: "my-app" },
      usersCallback
    );

    hubsync.offOnlineUsers(usersCallback);
    expect(socketMock.off).toHaveBeenCalledWith("status", statusListener);
  });
});
