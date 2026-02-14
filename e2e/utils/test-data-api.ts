import { type APIRequestContext } from "@playwright/test";

export class TestDataAPI {
  constructor(private readonly request: APIRequestContext) {}

  async createTag(data: { name: string; kind: "EFFECT" | "TERPENE" }) {
    const response = await this.request.post("/api/tags", { data });
    return response;
  }

  async deleteTag(id: string) {
    return this.request.delete(`/api/tags/${id}`);
  }

  async createPost(data: { body: string; reviewId?: string }) {
    const response = await this.request.post("/api/posts", { data });
    return response;
  }
}
