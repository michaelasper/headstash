import { test as base } from "@playwright/test";

import { TestDataAPI } from "../utils/test-data-api";

type TestDataFixtures = {
  dataApi: TestDataAPI;
};

export const test = base.extend<TestDataFixtures>({
  dataApi: async ({ request }, fixture) => {
    await fixture(new TestDataAPI(request));
  },
});

export { expect } from "@playwright/test";
