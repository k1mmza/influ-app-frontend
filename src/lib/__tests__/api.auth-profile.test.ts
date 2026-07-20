/**
 * Direct tests for src/lib/api.ts — Auth, Dashboard/Conversations-list/Messages,
 * Profile, Influencer lookup/claim, and Profile file-upload functions. Mocks
 * global.fetch (no fetch-mocking library installed); does NOT mock '@/lib/api'
 * itself, unlike the component-level tests elsewhere in this repo.
 */
import {
  apiRefresh,
  apiLogout,
  apiRegister,
  apiLogin,
  apiSelectRole,
  apiGetDashboard,
  apiGetConversations,
  apiGetMessages,
  apiGetProfile,
  apiGetCompleteness,
  apiUpdateProfile,
  apiSetAvatarUrl,
  apiDeleteRateCard,
  apiLookupInfluencerByUrl,
  apiFetchInfluencer,
  apiGetClaimCandidates,
  apiClaimProfile,
  apiUploadAvatar,
  apiUploadRateCard,
  apiAnalyzeMediaKit,
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

describe("apiRefresh", () => {
  it("200 exchanges a refresh token for a new token pair", async () => {
    mockFetchOnce(200, { access_token: "a", refresh_token: "b" });
    const result = await apiRefresh("r1");
    expect(result).toEqual({ access_token: "a", refresh_token: "b" });
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:3001/auth/refresh");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ refresh_token: "r1" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(401, { message: "Invalid refresh token" }, false);
    await expect(apiRefresh("bad")).rejects.toThrow("Invalid refresh token");
  });
});

describe("apiLogout", () => {
  it("resolves on success", async () => {
    mockFetchOnce(200, {});
    await expect(apiLogout("r1")).resolves.toBeUndefined();
  });

  it("never throws, even on network failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network error"));
    await expect(apiLogout("r1")).resolves.toBeUndefined();
  });
});

describe("apiRegister", () => {
  it("201 registers a new user", async () => {
    mockFetchOnce(201, { id: "u1" });
    const result = await apiRegister("Name", "a@b.com", "pw");
    expect(result).toEqual({ id: "u1" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ name: "Name", email: "a@b.com", password: "pw" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Email taken" }, false);
    await expect(apiRegister("Name", "a@b.com", "pw")).rejects.toThrow("Email taken");
  });
});

describe("apiLogin", () => {
  it("200 logs in and returns tokens", async () => {
    mockFetchOnce(200, { access_token: "t" });
    const result = await apiLogin("a@b.com", "pw");
    expect(result).toEqual({ access_token: "t" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(401, { message: "Invalid credentials" }, false);
    await expect(apiLogin("a@b.com", "wrong")).rejects.toThrow("Invalid credentials");
  });
});

describe("apiSelectRole", () => {
  it("200 selects a role, uppercasing it in the request body", async () => {
    mockFetchOnce(200, { role: "BRAND" });
    await apiSelectRole("tok", "brand" as any);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ role: "BRAND" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Invalid role" }, false);
    await expect(apiSelectRole("tok", "brand" as any)).rejects.toThrow("Invalid role");
  });
});

describe("apiGetDashboard", () => {
  it("200 returns dashboard data", async () => {
    mockFetchOnce(200, { totalCampaigns: 3 });
    expect(await apiGetDashboard("tok")).toEqual({ totalCampaigns: 3 });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(500, { message: "Server error" }, false);
    await expect(apiGetDashboard("tok")).rejects.toThrow("Server error");
  });
});

describe("apiGetConversations", () => {
  it("200 returns conversation list", async () => {
    mockFetchOnce(200, [{ id: "c1" }]);
    expect(await apiGetConversations("tok")).toEqual([{ id: "c1" }]);
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(500, { message: "Server error" }, false);
    await expect(apiGetConversations("tok")).rejects.toThrow("Server error");
  });
});

describe("apiGetMessages", () => {
  it("200 returns message list", async () => {
    mockFetchOnce(200, [{ id: "m1" }]);
    expect(await apiGetMessages("tok", "c1")).toEqual([{ id: "m1" }]);
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(500, { message: "Server error" }, false);
    await expect(apiGetMessages("tok", "c1")).rejects.toThrow("Server error");
  });
});

describe("apiGetProfile", () => {
  it("200 returns profile data", async () => {
    mockFetchOnce(200, { id: "u1" });
    expect(await apiGetProfile("tok")).toEqual({ id: "u1" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(500, { message: "Server error" }, false);
    await expect(apiGetProfile("tok")).rejects.toThrow("Server error");
  });
});

describe("apiGetCompleteness", () => {
  it("200 returns the completeness percentage", async () => {
    mockFetchOnce(200, { profileCompleteness: 80 });
    expect(await apiGetCompleteness("tok")).toBe(80);
  });

  it("non-ok returns 0 without throwing", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetCompleteness("tok")).resolves.toBe(0);
  });
});

describe("apiUpdateProfile", () => {
  it("200 patches the profile", async () => {
    mockFetchOnce(200, { bio: "hi" });
    expect(await apiUpdateProfile("tok", { bio: "hi" })).toEqual({ bio: "hi" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PATCH");
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Validation failed" }, false);
    await expect(apiUpdateProfile("tok", {})).rejects.toThrow("Validation failed");
  });
});

describe("apiSetAvatarUrl", () => {
  it("sends a PATCH with the avatar URL on success", async () => {
    mockFetchOnce(200, {});
    await apiSetAvatarUrl("tok", "https://x/avatar.png");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ avatarUrl: "https://x/avatar.png" });
  });

  it("does not throw on a non-ok response (no !res.ok check exists)", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiSetAvatarUrl("tok", "https://x/avatar.png")).resolves.toBeUndefined();
  });
});

describe("apiDeleteRateCard", () => {
  it("200 deletes the rate card", async () => {
    mockFetchOnce(200, {});
    await expect(apiDeleteRateCard("tok")).resolves.toBeUndefined();
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiDeleteRateCard("tok")).rejects.toThrow("Failed to remove rate card");
  });
});

describe("apiLookupInfluencerByUrl", () => {
  it("builds the query string via URLSearchParams", async () => {
    mockFetchOnce(200, { found: true });
    await apiLookupInfluencerByUrl("tiktok", "@handle");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("platform=tiktok");
    expect(url).toContain("handle=%40handle");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiLookupInfluencerByUrl("tiktok", "@handle")).rejects.toThrow("Lookup failed");
  });
});

describe("apiFetchInfluencer", () => {
  it("200 returns the influencer", async () => {
    mockFetchOnce(200, { id: "inf-1" });
    expect(await apiFetchInfluencer("inf-1")).toEqual({ id: "inf-1" });
  });

  it("non-ok returns null without throwing", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiFetchInfluencer("inf-1")).resolves.toBeNull();
  });
});

describe("apiGetClaimCandidates", () => {
  it("200 returns candidates", async () => {
    mockFetchOnce(200, [{ id: "inf-1" }]);
    expect(await apiGetClaimCandidates("tok", "inf-1")).toEqual([{ id: "inf-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetClaimCandidates("tok", "inf-1")).rejects.toThrow(
      "Failed to fetch claim candidates",
    );
  });
});

describe("apiClaimProfile", () => {
  it("200 claims a profile", async () => {
    mockFetchOnce(200, {});
    await apiClaimProfile("tok", "ext-1", "claimer-1");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ claimerInfluencerId: "claimer-1" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiClaimProfile("tok", "ext-1", "claimer-1")).rejects.toThrow("Claim failed");
  });
});

describe("apiUploadAvatar", () => {
  it("200 uploads via FormData", async () => {
    mockFetchOnce(200, { avatarUrl: "https://x/a.png" });
    const file = new File(["x"], "a.png", { type: "image/png" });
    const result = await apiUploadAvatar("tok", file);
    expect(result).toEqual({ avatarUrl: "https://x/a.png" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Avatar too large" }, false);
    const file = new File(["x"], "a.png", { type: "image/png" });
    await expect(apiUploadAvatar("tok", file)).rejects.toThrow("Avatar too large");
  });
});

describe("apiUploadRateCard", () => {
  it("200 uploads via FormData", async () => {
    mockFetchOnce(200, { rateCardFileUrl: "https://x/rc.pdf" });
    const file = new File(["x"], "rc.pdf", { type: "application/pdf" });
    const result = await apiUploadRateCard("tok", file);
    expect(result).toEqual({ rateCardFileUrl: "https://x/rc.pdf" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Upload rejected" }, false);
    const file = new File(["x"], "rc.pdf", { type: "application/pdf" });
    await expect(apiUploadRateCard("tok", file)).rejects.toThrow("Upload rejected");
  });
});

describe("apiAnalyzeMediaKit", () => {
  it("200 analyzes via FormData", async () => {
    mockFetchOnce(200, { proposed: {}, claimedMetrics: {}, warnings: [], source: "pdf" });
    const file = new File(["x"], "kit.pdf", { type: "application/pdf" });
    const result = await apiAnalyzeMediaKit("tok", file);
    expect(result.source).toBe("pdf");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("falls back to the default message when the error body is not valid JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("unexpected end of data");
      },
    } as unknown as Response);
    const file = new File(["x"], "kit.pdf", { type: "application/pdf" });
    await expect(apiAnalyzeMediaKit("tok", file)).rejects.toThrow("Media kit analysis failed");
  });
});
