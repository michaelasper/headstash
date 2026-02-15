import { expect, test } from "@playwright/test";

const seedEmails = ["alice@example.local", "bob@example.local"];

const assertNoSeedEmails = (body: string) => {
  for (const email of seedEmails) {
    expect(body).not.toContain(email);
  }
};

test("public pages do not leak seed user emails in rendered payloads", async ({ request }) => {
  const routes = ["/posts", "/posts/seed_post_alice_intro", "/search?q=alice", "/u/alice"];

  for (const route of routes) {
    const response = await request.get(route);
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    assertNoSeedEmails(body);
  }
});
