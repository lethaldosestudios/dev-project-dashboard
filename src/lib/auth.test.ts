/**
 * @jest-environment node
 */
import { DEV_BYPASS_EMAIL, requireAuth } from "./auth";

jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: jest.fn(),
}));

const { getCloudflareContext } = jest.requireMock("@opennextjs/cloudflare") as {
  getCloudflareContext: jest.Mock;
};

function requestWith(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/projects", { method: "POST", headers });
}

beforeEach(() => {
  getCloudflareContext.mockReset();
});

test("accepts the Cloudflare Access email header", async () => {
  getCloudflareContext.mockRejectedValue(new Error("no context"));

  const result = await requireAuth(requestWith({ "Cf-Access-User-Email": "porter@example.com" }));

  expect(result).toEqual({ email: "porter@example.com" });
});

test("returns 401 when the header is absent and the bypass is not configured", async () => {
  getCloudflareContext.mockResolvedValue({ env: {} });

  const result = await requireAuth(requestWith());

  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(401);
});

test("returns 401 when the Cloudflare context is unavailable", async () => {
  getCloudflareContext.mockRejectedValue(new Error("getCloudflareContext called outside request"));

  const result = await requireAuth(requestWith());

  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(401);
});

test("returns 401 when DEV_AUTH_BYPASS is set to anything but 'true'", async () => {
  getCloudflareContext.mockResolvedValue({ env: { DEV_AUTH_BYPASS: "1" } });

  const result = await requireAuth(requestWith());

  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(401);
});

test("honours an explicit DEV_AUTH_BYPASS=true opt-in", async () => {
  getCloudflareContext.mockResolvedValue({ env: { DEV_AUTH_BYPASS: "true" } });

  const result = await requireAuth(requestWith());

  expect(result).toEqual({ email: DEV_BYPASS_EMAIL });
});

test("prefers the Access header over the bypass", async () => {
  getCloudflareContext.mockResolvedValue({ env: { DEV_AUTH_BYPASS: "true" } });

  const result = await requireAuth(requestWith({ "Cf-Access-User-Email": "porter@example.com" }));

  expect(result).toEqual({ email: "porter@example.com" });
});
