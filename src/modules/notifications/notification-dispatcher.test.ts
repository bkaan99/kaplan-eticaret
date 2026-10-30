import { describe, expect, it, vi } from "vitest";
import type { JobQueue } from "@/shared/queue";
import {
  JOB_SEND_EMAIL,
  QueueNotificationDispatcher,
} from "./notification-dispatcher";

describe("QueueNotificationDispatcher", () => {
  it("verilen e-postayı JOB_SEND_EMAIL iş tipiyle kuyruğa atar", async () => {
    const enqueue = vi.fn(async () => "job-1");
    const queue = { enqueue } as unknown as JobQueue;
    const dispatcher = new QueueNotificationDispatcher(queue, 3);

    await dispatcher.dispatch("test@example.com", {
      subject: "Test Başlık",
      html: "<p>Test</p>",
      text: "Test",
    });

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(
      JOB_SEND_EMAIL,
      {
        to: "test@example.com",
        subject: "Test Başlık",
        html: "<p>Test</p>",
        text: "Test",
      },
      { retryLimit: 3 },
    );
  });
});
