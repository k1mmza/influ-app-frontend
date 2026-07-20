/**
 * Direct tests for src/lib/api.ts — Tracking, Tracking/Campaign share links,
 * public influencer list, and Platform-connect functions. Mocks global.fetch;
 * does not mock '@/lib/api' itself.
 */
import {
  apiGetTracking,
  apiGetTrackingDetail,
  apiGetTrackingReport,
  apiCreateShareLink,
  apiListShareLinks,
  apiRevokeShareLink,
  apiGetPublicTrackingReport,
  apiCreateCampaignShareLink,
  apiListCampaignShareLinks,
  apiRevokeCampaignShareLink,
  apiGetPublicCampaign,
  apiGetPublicInfluencerList,
  apiConnectPlatform,
  apiDisconnectPlatform,
} from "@/lib/api";

function mockFetchOnce(status: number, body?: unknown, ok: boolean = status < 300) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  } as unknown as Response);
}

beforeEach(() => {
  global.fetch = jest.fn();
});

describe("apiGetTracking", () => {
  it("200 returns tracking summary rows", async () => {
    mockFetchOnce(200, [{ id: "camp-1" }]);
    expect(await apiGetTracking("tok")).toEqual([{ id: "camp-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetTracking("tok")).rejects.toThrow("Failed to fetch tracking data");
  });
});

describe("apiGetTrackingDetail", () => {
  it("200 returns tracking detail rows", async () => {
    mockFetchOnce(200, [{ id: "row-1" }]);
    expect(await apiGetTrackingDetail("tok", "camp-1")).toEqual([{ id: "row-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetTrackingDetail("tok", "camp-1")).rejects.toThrow(
      "Failed to fetch tracking detail",
    );
  });
});

describe("apiGetTrackingReport", () => {
  it("200 returns the tracking report", async () => {
    mockFetchOnce(200, { campaign: { id: "camp-1" } });
    expect(await apiGetTrackingReport("tok", "camp-1")).toEqual({ campaign: { id: "camp-1" } });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetTrackingReport("tok", "camp-1")).rejects.toThrow(
      "Failed to fetch tracking report",
    );
  });
});

describe("apiCreateShareLink", () => {
  it("200 creates a tracking share link", async () => {
    mockFetchOnce(201, { id: "link-1", token: "tok-1" });
    expect(await apiCreateShareLink("tok", "camp-1")).toEqual({ id: "link-1", token: "tok-1" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiCreateShareLink("tok", "camp-1")).rejects.toThrow("Failed to create share link");
  });
});

describe("apiListShareLinks", () => {
  it("200 lists tracking share links", async () => {
    mockFetchOnce(200, [{ id: "link-1" }]);
    expect(await apiListShareLinks("tok", "camp-1")).toEqual([{ id: "link-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiListShareLinks("tok", "camp-1")).rejects.toThrow("Failed to load share links");
  });
});

describe("apiRevokeShareLink", () => {
  it("200 revokes a tracking share link", async () => {
    mockFetchOnce(200, { revoked: true });
    expect(await apiRevokeShareLink("tok", "link-1")).toEqual({ revoked: true });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiRevokeShareLink("tok", "link-1")).rejects.toThrow("Failed to revoke share link");
  });
});

describe("apiGetPublicTrackingReport", () => {
  it("sends no Authorization header", async () => {
    mockFetchOnce(200, { campaign: { name: "Camp" } });
    await apiGetPublicTrackingReport("share-tok");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init?.headers).toBeUndefined();
  });

  it("200 returns the public report", async () => {
    mockFetchOnce(200, { campaign: { name: "Camp" } });
    expect(await apiGetPublicTrackingReport("share-tok")).toEqual({ campaign: { name: "Camp" } });
  });

  it("non-ok throws with the fallback message", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetPublicTrackingReport("dead-tok")).rejects.toThrow(
      "This report link is no longer available",
    );
  });
});

describe("apiCreateCampaignShareLink", () => {
  it("200 creates a campaign share link", async () => {
    mockFetchOnce(201, { id: "link-1", token: "tok-1" });
    expect(await apiCreateCampaignShareLink("tok", "camp-1")).toEqual({ id: "link-1", token: "tok-1" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiCreateCampaignShareLink("tok", "camp-1")).rejects.toThrow(
      "Failed to create share link",
    );
  });
});

describe("apiListCampaignShareLinks", () => {
  it("200 lists campaign share links", async () => {
    mockFetchOnce(200, [{ id: "link-1" }]);
    expect(await apiListCampaignShareLinks("tok", "camp-1")).toEqual([{ id: "link-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiListCampaignShareLinks("tok", "camp-1")).rejects.toThrow(
      "Failed to load share links",
    );
  });
});

describe("apiRevokeCampaignShareLink", () => {
  it("200 revokes a campaign share link", async () => {
    mockFetchOnce(200, { revoked: true });
    expect(await apiRevokeCampaignShareLink("tok", "link-1")).toEqual({ revoked: true });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiRevokeCampaignShareLink("tok", "link-1")).rejects.toThrow(
      "Failed to revoke share link",
    );
  });
});

describe("apiGetPublicCampaign", () => {
  it("sends no Authorization header", async () => {
    mockFetchOnce(200, { name: "Camp" });
    await apiGetPublicCampaign("share-tok");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init?.headers).toBeUndefined();
  });

  it("200 returns the public campaign", async () => {
    mockFetchOnce(200, { name: "Camp" });
    expect(await apiGetPublicCampaign("share-tok")).toEqual({ name: "Camp" });
  });

  it("non-ok throws with the fallback message", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetPublicCampaign("dead-tok")).rejects.toThrow(
      "This campaign link is no longer available",
    );
  });
});

describe("apiGetPublicInfluencerList", () => {
  it("sends no Authorization header", async () => {
    mockFetchOnce(200, { campaign: {}, influencers: [] });
    await apiGetPublicInfluencerList("share-tok");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init?.headers).toBeUndefined();
  });

  it("200 returns the public influencer list", async () => {
    mockFetchOnce(200, { campaign: {}, influencers: [] });
    expect(await apiGetPublicInfluencerList("share-tok")).toEqual({ campaign: {}, influencers: [] });
  });

  it("non-ok throws with the fallback message", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetPublicInfluencerList("dead-tok")).rejects.toThrow(
      "This link is no longer available",
    );
  });
});

describe("apiConnectPlatform", () => {
  it("200 initiates a platform connection", async () => {
    mockFetchOnce(200, { authUrl: "https://tiktok.com/oauth" });
    expect(await apiConnectPlatform("tok", "tiktok")).toEqual({ authUrl: "https://tiktok.com/oauth" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Already connected" }, false);
    await expect(apiConnectPlatform("tok", "tiktok")).rejects.toThrow("Already connected");
  });
});

describe("apiDisconnectPlatform", () => {
  it("sends a DELETE with a JSON body", async () => {
    mockFetchOnce(200, {});
    await apiDisconnectPlatform("tok", "tiktok");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body)).toEqual({ platform: "tiktok" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiDisconnectPlatform("tok", "tiktok")).rejects.toThrow(
      "Failed to disconnect tiktok account",
    );
  });
});
