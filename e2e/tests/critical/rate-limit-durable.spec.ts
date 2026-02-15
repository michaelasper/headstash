import { expect, test } from "@playwright/test";

const PASSWORD = "password123";

test("signup limiter keys on identity + source IP", async ({ request }) => {
  const email = `ratelimit-ip-${Date.now()}@example.local`;
  const ipA = "203.0.113.10";
  const ipB = "203.0.113.11";

  const statusesA: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    const res = await request.post("/api/auth/credentials/signup", {
      data: { email, password: PASSWORD },
      headers: { "x-forwarded-for": ipA },
    });
    statusesA.push(res.status());
  }

  expect(statusesA.slice(0, 5).every((s) => s === 200)).toBeTruthy();
  expect(statusesA[5]).toBe(429);

  const otherIp = await request.post("/api/auth/credentials/signup", {
    data: { email, password: PASSWORD },
    headers: { "x-forwarded-for": ipB },
  });

  expect(otherIp.status()).toBe(200);
});

test("signup limiter enforces consistently under parallel load", async ({ request }) => {
  const email = `ratelimit-parallel-${Date.now()}@example.local`;
  const ip = "198.51.100.24";

  const responses = await Promise.all(
    Array.from({ length: 10 }, () =>
      request.post("/api/auth/credentials/signup", {
        data: { email, password: PASSWORD },
        headers: { "x-forwarded-for": ip },
      }),
    ),
  );

  const statuses = responses.map((r) => r.status());
  const allowed = statuses.filter((s) => s === 200).length;
  const blocked = statuses.filter((s) => s === 429).length;

  expect(statuses.every((s) => s === 200 || s === 429)).toBeTruthy();
  expect(allowed).toBeGreaterThan(0);
  expect(blocked).toBeGreaterThan(0);
});
