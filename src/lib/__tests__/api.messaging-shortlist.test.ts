/**
 * Direct tests for src/lib/api.ts — Conversations/messaging, brand-global
 * shortlist, campaign-scoped shortlist, shortlist share links, and conversation
 * file upload functions. Mocks global.fetch; does not mock '@/lib/api' itself.
 */
import {
  apiSendMessage,
  apiStartConversation,
  apiMarkPhaseReady,
  apiMarkConversationRead,
  apiGetConversation,
  apiGetConversationBrief,
  apiGetShortlist,
  apiAddToShortlist,
  apiRemoveFromShortlist,
  apiGetCampaignShortlist,
  apiAddCampaignShortlist,
  apiUpdateCampaignShortlistNote,
  apiRemoveCampaignShortlist,
  apiCreateShortlistShareLink,
  apiListShortlistShareLinks,
  apiRevokeShortlistShareLink,
  apiUploadConversationFile,
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

describe("apiSendMessage", () => {
  it("200 sends a message", async () => {
    mockFetchOnce(200, { id: "m1", content: "hi" });
    expect(await apiSendMessage("tok", "c1", "hi")).toEqual({ id: "m1", content: "hi" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Empty content" }, false);
    await expect(apiSendMessage("tok", "c1", "")).rejects.toThrow("Empty content");
  });
});

describe("apiStartConversation", () => {
  it("200 starts a conversation", async () => {
    mockFetchOnce(200, { id: "c1" });
    expect(await apiStartConversation("tok", "inf-1", "camp-1")).toEqual({ id: "c1" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Already exists" }, false);
    await expect(apiStartConversation("tok", "inf-1", "camp-1")).rejects.toThrow("Already exists");
  });
});

describe("apiMarkPhaseReady", () => {
  it("200 marks the phase ready", async () => {
    mockFetchOnce(200, { workPhase: "REVIEW", brandPhaseReady: true, influencerPhaseReady: false });
    const result = await apiMarkPhaseReady("tok", "c1");
    expect(result.workPhase).toBe("REVIEW");
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Invalid phase" }, false);
    await expect(apiMarkPhaseReady("tok", "c1")).rejects.toThrow("Invalid phase");
  });
});

describe("apiMarkConversationRead", () => {
  it("sends a PATCH on success", async () => {
    mockFetchOnce(200, {});
    await apiMarkConversationRead("tok", "c1");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PATCH");
  });

  it("silently resolves without throwing on a non-ok response", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiMarkConversationRead("tok", "c1")).resolves.toBeUndefined();
  });
});

describe("apiGetConversation", () => {
  it("200 returns the conversation", async () => {
    mockFetchOnce(200, { id: "c1" });
    expect(await apiGetConversation("tok", "c1")).toEqual({ id: "c1" });
  });

  it("non-ok returns null without throwing", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetConversation("tok", "c1")).resolves.toBeNull();
  });
});

describe("apiGetConversationBrief", () => {
  it("200 returns the brief", async () => {
    mockFetchOnce(200, { campaign: null, requirement: null, smartPlanBrief: null, briefFileUrl: null });
    const result = await apiGetConversationBrief("tok", "c1");
    expect(result?.briefFileUrl).toBeNull();
  });

  it("non-ok returns null without throwing", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetConversationBrief("tok", "c1")).resolves.toBeNull();
  });
});

describe("apiGetShortlist", () => {
  it("200 returns the shortlist", async () => {
    mockFetchOnce(200, [{ influencerId: "inf-1" }]);
    expect(await apiGetShortlist("tok")).toEqual([{ influencerId: "inf-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetShortlist("tok")).rejects.toThrow("Failed to fetch shortlist");
  });
});

describe("apiAddToShortlist", () => {
  it("200 adds to the shortlist", async () => {
    mockFetchOnce(200, {});
    await expect(apiAddToShortlist("tok", "inf-1")).resolves.toBeUndefined();
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiAddToShortlist("tok", "inf-1")).rejects.toThrow("Failed to add to shortlist");
  });
});

describe("apiRemoveFromShortlist", () => {
  it("200 removes from the shortlist", async () => {
    mockFetchOnce(200, {});
    await expect(apiRemoveFromShortlist("tok", "inf-1")).resolves.toBeUndefined();
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiRemoveFromShortlist("tok", "inf-1")).rejects.toThrow(
      "Failed to remove from shortlist",
    );
  });
});

describe("apiGetCampaignShortlist", () => {
  it("200 returns the campaign shortlist", async () => {
    mockFetchOnce(200, [{ id: "row-1" }]);
    expect(await apiGetCampaignShortlist("tok", "camp-1")).toEqual([{ id: "row-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetCampaignShortlist("tok", "camp-1")).rejects.toThrow(
      "Failed to load campaign shortlist",
    );
  });
});

describe("apiAddCampaignShortlist", () => {
  it("sends only the base fields when extra is omitted", async () => {
    mockFetchOnce(200, { id: "row-1" });
    await apiAddCampaignShortlist("tok", "camp-1", "inf-1");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ influencerId: "inf-1" });
  });

  it("merges extra fields into the request body when provided", async () => {
    mockFetchOnce(200, { id: "row-1" });
    await apiAddCampaignShortlist("tok", "camp-1", "inf-1", {
      recommendationNote: "great fit",
      proposedPrice: 500,
    });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      influencerId: "inf-1",
      recommendationNote: "great fit",
      proposedPrice: 500,
    });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiAddCampaignShortlist("tok", "camp-1", "inf-1")).rejects.toThrow(
      "Failed to add to campaign shortlist",
    );
  });
});

describe("apiUpdateCampaignShortlistNote", () => {
  it("200 updates the note", async () => {
    mockFetchOnce(200, { id: "row-1", recommendationNote: "updated" });
    await apiUpdateCampaignShortlistNote("tok", "camp-1", "inf-1", { recommendationNote: "updated" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PATCH");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(
      apiUpdateCampaignShortlistNote("tok", "camp-1", "inf-1", {}),
    ).rejects.toThrow("Failed to update note");
  });
});

describe("apiRemoveCampaignShortlist", () => {
  it("200 removes from the campaign shortlist", async () => {
    mockFetchOnce(200, { success: true });
    expect(await apiRemoveCampaignShortlist("tok", "camp-1", "inf-1")).toEqual({ success: true });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiRemoveCampaignShortlist("tok", "camp-1", "inf-1")).rejects.toThrow(
      "Failed to remove from campaign shortlist",
    );
  });
});

describe("apiCreateShortlistShareLink", () => {
  it("200 creates a shortlist share link", async () => {
    mockFetchOnce(201, { id: "link-1", token: "tok-1" });
    expect(await apiCreateShortlistShareLink("tok", "camp-1")).toEqual({ id: "link-1", token: "tok-1" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiCreateShortlistShareLink("tok", "camp-1")).rejects.toThrow(
      "Failed to create share link",
    );
  });
});

describe("apiListShortlistShareLinks", () => {
  it("200 lists shortlist share links", async () => {
    mockFetchOnce(200, [{ id: "link-1" }]);
    expect(await apiListShortlistShareLinks("tok", "camp-1")).toEqual([{ id: "link-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiListShortlistShareLinks("tok", "camp-1")).rejects.toThrow(
      "Failed to load share links",
    );
  });
});

describe("apiRevokeShortlistShareLink", () => {
  it("200 revokes a shortlist share link", async () => {
    mockFetchOnce(200, { revoked: true });
    expect(await apiRevokeShortlistShareLink("tok", "link-1")).toEqual({ revoked: true });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiRevokeShortlistShareLink("tok", "link-1")).rejects.toThrow(
      "Failed to revoke share link",
    );
  });
});

describe("apiUploadConversationFile", () => {
  it("200 uploads with both file and type fields", async () => {
    mockFetchOnce(200, { url: "https://x/f.pdf", type: "contract" });
    const file = new File(["x"], "f.pdf", { type: "application/pdf" });
    const result = await apiUploadConversationFile("tok", "c1", "contract", file);
    expect(result).toEqual({ url: "https://x/f.pdf", type: "contract" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.body as FormData).get("file")).toBe(file);
    expect((init.body as FormData).get("type")).toBe("contract");
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Upload failed" }, false);
    const file = new File(["x"], "f.pdf", { type: "application/pdf" });
    await expect(apiUploadConversationFile("tok", "c1", "contract", file)).rejects.toThrow(
      "Upload failed",
    );
  });
});
