/**
 * Isolated tests for the authFetch 401-retry interceptor (api.ts, module-private).
 * Not exported directly, so exercised through public functions that route through
 * it: apiGetDashboard (sends a Bearer token) and apiGetPublicCampaign (sends none).
 */
import { apiGetDashboard, apiGetPublicCampaign, registerTokenRefresher } from "@/lib/api";

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  registerTokenRefresher(null);
});

describe("authFetch interceptor", () => {
  it("retries once with a fresh token on 401 when a refresher is registered and a Bearer token was sent", async () => {
    const refresher = jest.fn().mockResolvedValue("fresh-token");
    registerTokenRefresher(refresher);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ totalCampaigns: 1 }) } as unknown as Response);

    const result = await apiGetDashboard("expired-token");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(refresher).toHaveBeenCalledWith("expired-token");
    const secondCallInit = (global.fetch as jest.Mock).mock.calls[1][1];
    expect(secondCallInit.headers.Authorization).toBe("Bearer fresh-token");
    expect(result).toEqual({ totalCampaigns: 1 });
  });

  it("does not retry when the refresher resolves null (refresh failed)", async () => {
    const refresher = jest.fn().mockResolvedValue(null);
    registerTokenRefresher(refresher);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    } as unknown as Response);

    await expect(apiGetDashboard("expired-token")).rejects.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry when the refresher resolves the same (unchanged) token", async () => {
    const refresher = jest.fn().mockResolvedValue("expired-token");
    registerTokenRefresher(refresher);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    } as unknown as Response);

    await expect(apiGetDashboard("expired-token")).rejects.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry when no Authorization header was present on the original request", async () => {
    const refresher = jest.fn().mockResolvedValue("fresh-token");
    registerTokenRefresher(refresher);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as unknown as Response);

    await expect(apiGetPublicCampaign("tok-1")).rejects.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(refresher).not.toHaveBeenCalled();
  });
});
