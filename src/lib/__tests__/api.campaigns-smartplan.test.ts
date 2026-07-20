/**
 * Direct tests for src/lib/api.ts — Smart Plan, Campaigns core CRUD, and Client
 * Brands functions. Mocks global.fetch; does not mock '@/lib/api' itself.
 */
import {
  apiGenerateSmartPlan,
  apiUploadBriefImage,
  apiCreateCampaignFromPlan,
  apiSaveSmartPlanBrief,
  apiGetSmartPlanBrief,
  apiDeleteSmartPlanBrief,
  apiGetCampaigns,
  apiGetPublicCampaigns,
  apiCreateCampaign,
  apiGetCampaign,
  apiUpdateCampaign,
  apiUploadCampaignCover,
  apiUploadCampaignBriefImage,
  apiDeleteCampaign,
  apiApplyToCampaign,
  apiGetCampaignApplications,
  apiUpdateCampaignApplicationStatus,
  apiGetClientBrands,
  apiCreateManagedBrand,
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

describe("apiGenerateSmartPlan", () => {
  it("200 generates a plan", async () => {
    mockFetchOnce(200, { strategy: "s", concept: "c", briefBody: "b", campaignFields: {}, provenance: {} });
    const result = await apiGenerateSmartPlan("tok", {});
    expect(result.strategy).toBe("s");
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Missing input" }, false);
    await expect(apiGenerateSmartPlan("tok", {})).rejects.toThrow("Missing input");
  });
});

describe("apiUploadBriefImage", () => {
  it("200 uploads via FormData", async () => {
    mockFetchOnce(200, { url: "https://x/b.png" });
    const file = new File(["x"], "b.png", { type: "image/png" });
    const result = await apiUploadBriefImage("tok", file);
    expect(result).toEqual({ url: "https://x/b.png" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    const file = new File(["x"], "b.png", { type: "image/png" });
    await expect(apiUploadBriefImage("tok", file)).rejects.toThrow("Failed to upload brief image");
  });
});

describe("apiCreateCampaignFromPlan", () => {
  it("200 creates a campaign from plan", async () => {
    mockFetchOnce(200, { campaignId: "camp-1" });
    expect(await apiCreateCampaignFromPlan("tok", { campaignFields: {} })).toEqual({ campaignId: "camp-1" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "clientBrandId required" }, false);
    await expect(apiCreateCampaignFromPlan("tok", { campaignFields: {} })).rejects.toThrow(
      "clientBrandId required",
    );
  });
});

describe("apiSaveSmartPlanBrief", () => {
  it("200 saves the brief", async () => {
    mockFetchOnce(200, { id: "brief-1" });
    expect(await apiSaveSmartPlanBrief("tok", {})).toEqual({ id: "brief-1" });
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(400, { message: "Invalid brief" }, false);
    await expect(apiSaveSmartPlanBrief("tok", {})).rejects.toThrow("Invalid brief");
  });
});

describe("apiGetSmartPlanBrief", () => {
  it("returns null when the ok response has an empty body", async () => {
    mockFetchOnce(200, undefined);
    await expect(apiGetSmartPlanBrief("tok")).resolves.toBeNull();
  });

  it("parses the JSON body when present", async () => {
    mockFetchOnce(200, { strategy: "s", concept: "c", briefBody: "b" });
    expect(await apiGetSmartPlanBrief("tok")).toEqual({ strategy: "s", concept: "c", briefBody: "b" });
  });

  it("returns null on a non-ok response without throwing", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetSmartPlanBrief("tok")).resolves.toBeNull();
  });
});

describe("apiDeleteSmartPlanBrief", () => {
  it("sends no query string without a campaignId", async () => {
    mockFetchOnce(200, { deleted: 1 });
    await apiDeleteSmartPlanBrief("tok");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:3001/smart-plan/brief");
  });

  it("appends an encoded campaignId query string when provided", async () => {
    mockFetchOnce(200, { deleted: 1 });
    await apiDeleteSmartPlanBrief("tok", "camp 1");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:3001/smart-plan/brief?campaignId=camp%201");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiDeleteSmartPlanBrief("tok")).rejects.toThrow("Failed to delete brief");
  });
});

describe("apiGetCampaigns", () => {
  it("200 returns campaigns", async () => {
    mockFetchOnce(200, [{ id: "camp-1" }]);
    expect(await apiGetCampaigns("tok")).toEqual([{ id: "camp-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetCampaigns("tok")).rejects.toThrow("Failed to fetch campaigns");
  });
});

describe("apiGetPublicCampaigns", () => {
  it("defaults to page=1&pageSize=12", async () => {
    mockFetchOnce(200, { data: [], total: 0, page: 1, pageSize: 12, totalPages: 0 });
    await apiGetPublicCampaigns("tok");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("page=1&pageSize=12");
  });

  it("uses explicit page/pageSize overrides", async () => {
    mockFetchOnce(200, { data: [], total: 0, page: 2, pageSize: 5, totalPages: 0 });
    await apiGetPublicCampaigns("tok", 2, 5);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("page=2&pageSize=5");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetPublicCampaigns("tok")).rejects.toThrow("Failed to fetch public campaigns");
  });
});

describe("apiCreateCampaign", () => {
  it("200 creates a campaign", async () => {
    mockFetchOnce(201, { id: "camp-1", name: "Camp" });
    expect(await apiCreateCampaign("tok", { name: "Camp" })).toEqual({ id: "camp-1", name: "Camp" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, { message: "name required" }, false);
    await expect(apiCreateCampaign("tok", {} as any)).rejects.toThrow("name required");
  });
});

describe("apiGetCampaign", () => {
  it("200 returns a campaign", async () => {
    mockFetchOnce(200, { id: "camp-1" });
    expect(await apiGetCampaign("tok", "camp-1")).toEqual({ id: "camp-1" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(404, undefined, false);
    await expect(apiGetCampaign("tok", "camp-1")).rejects.toThrow("Failed to fetch campaign");
  });
});

describe("apiUpdateCampaign", () => {
  it("200 patches a campaign", async () => {
    mockFetchOnce(200, { id: "camp-1", name: "Updated" });
    expect(await apiUpdateCampaign("tok", "camp-1", { name: "Updated" })).toEqual({
      id: "camp-1",
      name: "Updated",
    });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, undefined, false);
    await expect(apiUpdateCampaign("tok", "camp-1", {})).rejects.toThrow("Failed to update campaign");
  });
});

describe("apiUploadCampaignCover", () => {
  it("200 uploads via FormData", async () => {
    mockFetchOnce(200, { id: "camp-1", coverImageUrl: "https://x/c.png" });
    const file = new File(["x"], "c.png", { type: "image/png" });
    await apiUploadCampaignCover("tok", "camp-1", file);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    const file = new File(["x"], "c.png", { type: "image/png" });
    await expect(apiUploadCampaignCover("tok", "camp-1", file)).rejects.toThrow(
      "Failed to upload cover image",
    );
  });
});

describe("apiUploadCampaignBriefImage", () => {
  it("200 uploads via FormData", async () => {
    mockFetchOnce(200, { id: "camp-1", briefImageUrl: "https://x/b.png" });
    const file = new File(["x"], "b.png", { type: "image/png" });
    await apiUploadCampaignBriefImage("tok", "camp-1", file);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    const file = new File(["x"], "b.png", { type: "image/png" });
    await expect(apiUploadCampaignBriefImage("tok", "camp-1", file)).rejects.toThrow(
      "Failed to upload brief image",
    );
  });
});

describe("apiDeleteCampaign", () => {
  it("200 deletes a campaign", async () => {
    mockFetchOnce(200, {});
    await expect(apiDeleteCampaign("tok", "camp-1")).resolves.toBeUndefined();
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiDeleteCampaign("tok", "camp-1")).rejects.toThrow("Failed to delete campaign");
  });
});

describe("apiApplyToCampaign", () => {
  it("200 applies to a campaign", async () => {
    mockFetchOnce(200, { id: "app-1" });
    expect(await apiApplyToCampaign("tok", "camp-1")).toEqual({ id: "app-1" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, undefined, false);
    await expect(apiApplyToCampaign("tok", "camp-1")).rejects.toThrow("Failed to apply to campaign");
  });
});

describe("apiGetCampaignApplications", () => {
  it("200 returns applications", async () => {
    mockFetchOnce(200, [{ id: "app-1" }]);
    expect(await apiGetCampaignApplications("tok", "camp-1")).toEqual([{ id: "app-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetCampaignApplications("tok", "camp-1")).rejects.toThrow(
      "Failed to fetch applications",
    );
  });
});

describe("apiUpdateCampaignApplicationStatus", () => {
  it("200 updates application status", async () => {
    mockFetchOnce(200, { id: "app-1", status: "ACCEPTED" });
    await apiUpdateCampaignApplicationStatus("tok", "camp-1", "app-1", "ACCEPTED");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ status: "ACCEPTED" });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, undefined, false);
    await expect(
      apiUpdateCampaignApplicationStatus("tok", "camp-1", "app-1", "ACCEPTED"),
    ).rejects.toThrow("Failed to update application");
  });
});

describe("apiGetClientBrands", () => {
  it("sends no search query param when omitted", async () => {
    mockFetchOnce(200, []);
    await apiGetClientBrands("tok");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:3001/client-brands");
  });

  it("trims whitespace before encoding the search param", async () => {
    mockFetchOnce(200, []);
    await apiGetClientBrands("tok", "  acme  ");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:3001/client-brands?search=acme");
  });

  it("sends no search query param when search is empty after trim", async () => {
    mockFetchOnce(200, []);
    await apiGetClientBrands("tok", "   ");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:3001/client-brands");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetClientBrands("tok")).rejects.toThrow("Failed to fetch client brands");
  });
});

describe("apiCreateManagedBrand", () => {
  it("201 creates a managed brand", async () => {
    mockFetchOnce(201, { id: "cb-1", brandName: "Acme" });
    expect(await apiCreateManagedBrand("tok", { brandName: "Acme" })).toEqual({
      id: "cb-1",
      brandName: "Acme",
    });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, { message: "brandName required" }, false);
    await expect(apiCreateManagedBrand("tok", {} as any)).rejects.toThrow("brandName required");
  });
});
