const MAILDEV_URL = process.env.MAILDEV_URL ?? "http://localhost:1080";
const RESET_LINK_PATTERN = /https?:\/\/\S+\/reset-password\?token=[0-9a-f]+/;
const POLL_INTERVAL_MS = 250;
const POLL_TIMEOUT_MS = 15_000;

interface MaildevMessage {
  time: string;
  text?: string;
  html?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deletes every message currently sitting in Maildev's mailbox, so a later
 * call to readLatestResetLink() cannot pick up a message left over from an
 * earlier request.
 */
export async function clearMailbox(): Promise<void> {
  await fetch(`${MAILDEV_URL}/email/all`, { method: "DELETE" });
}

/**
 * Reads the most recently received message from Maildev's REST API
 * (`GET /email`) and extracts the password-reset link from its body. Polls
 * with a bounded retry, since SMTP delivery to Maildev happens
 * asynchronously relative to the HTTP response that triggered it, and throws
 * a descriptive error if no matching message arrives before the deadline.
 */
export async function readLatestResetLink(): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${MAILDEV_URL}/email`);
    if (res.ok) {
      const messages = (await res.json()) as MaildevMessage[];
      if (messages.length > 0) {
        // Maildev returns messages oldest-first and its `time` field only
        // has second-level precision, so ties must favor the later array
        // entry rather than the first one seen.
        const latest = messages.reduce((newest, message) =>
          new Date(message.time) >= new Date(newest.time) ? message : newest,
        );
        const match = RESET_LINK_PATTERN.exec(latest.text ?? latest.html ?? "");
        if (match) return match[0];
      }
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`No password reset email found at ${MAILDEV_URL} within ${POLL_TIMEOUT_MS}ms`);
}
