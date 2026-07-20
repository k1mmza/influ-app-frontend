/**
 * Direct tests for src/lib/api.ts — Drafts, Payments, and Invitations functions.
 * Mocks global.fetch; does not mock '@/lib/api' itself.
 */
import {
  apiGetDrafts,
  apiCreateDraft,
  apiUpdateDraft,
  apiDeleteDraft,
  apiReviewDraft,
  apiUploadDraftFile,
  apiGetPayments,
  apiCreatePayment,
  apiUploadPaymentProof,
  apiConfirmPayment,
  apiInviteToCampaign,
  apiGetInvitations,
  apiAcceptInvitation,
  apiDeclineInvitation,
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

describe("apiGetDrafts", () => {
  it("200 returns drafts", async () => {
    mockFetchOnce(200, [{ id: "d1" }]);
    expect(await apiGetDrafts("tok", "c1")).toEqual([{ id: "d1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetDrafts("tok", "c1")).rejects.toThrow("Failed to fetch drafts");
  });
});

describe("apiCreateDraft", () => {
  it("200 creates a draft", async () => {
    mockFetchOnce(201, { id: "d1", title: "Draft 1" });
    expect(await apiCreateDraft("tok", "c1", { title: "Draft 1" })).toEqual({
      id: "d1",
      title: "Draft 1",
    });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, undefined, false);
    await expect(apiCreateDraft("tok", "c1", { title: "" })).rejects.toThrow("Failed to create draft");
  });
});

describe("apiUpdateDraft", () => {
  it("200 updates a draft", async () => {
    mockFetchOnce(200, { id: "d1", title: "Updated" });
    await apiUpdateDraft("tok", "c1", "d1", { title: "Updated" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PATCH");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiUpdateDraft("tok", "c1", "d1", {})).rejects.toThrow("Failed to update draft");
  });
});

describe("apiDeleteDraft", () => {
  it("200 deletes a draft", async () => {
    mockFetchOnce(200, {});
    await expect(apiDeleteDraft("tok", "c1", "d1")).resolves.toBeUndefined();
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiDeleteDraft("tok", "c1", "d1")).rejects.toThrow("Failed to delete draft");
  });
});

describe("apiReviewDraft", () => {
  it("200 reviews a draft", async () => {
    mockFetchOnce(200, { id: "d1", status: "APPROVED" });
    const result = await apiReviewDraft("tok", "c1", "d1", { status: "APPROVED" });
    expect(result.status).toBe("APPROVED");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(
      apiReviewDraft("tok", "c1", "d1", { status: "APPROVED" }),
    ).rejects.toThrow("Failed to review draft");
  });
});

describe("apiUploadDraftFile", () => {
  it("200 uploads via FormData", async () => {
    mockFetchOnce(200, { id: "d1", fileUrl: "https://x/f.pdf" });
    const file = new File(["x"], "f.pdf", { type: "application/pdf" });
    await apiUploadDraftFile("tok", "c1", "d1", file);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    const file = new File(["x"], "f.pdf", { type: "application/pdf" });
    await expect(apiUploadDraftFile("tok", "c1", "d1", file)).rejects.toThrow(
      "Failed to upload draft file",
    );
  });
});

describe("apiGetPayments", () => {
  it("200 returns payments", async () => {
    mockFetchOnce(200, [{ id: "p1" }]);
    expect(await apiGetPayments("tok", "c1")).toEqual([{ id: "p1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetPayments("tok", "c1")).rejects.toThrow("Failed to fetch payments");
  });
});

describe("apiCreatePayment", () => {
  it("200 creates a payment", async () => {
    mockFetchOnce(201, { id: "p1", amount: 500 });
    expect(await apiCreatePayment("tok", "c1", { amount: 500 })).toEqual({ id: "p1", amount: 500 });
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, undefined, false);
    await expect(apiCreatePayment("tok", "c1", { amount: 500 })).rejects.toThrow(
      "Failed to create payment",
    );
  });
});

describe("apiUploadPaymentProof", () => {
  it("200 uploads via FormData", async () => {
    mockFetchOnce(200, { id: "p1", proofUrl: "https://x/proof.png" });
    const file = new File(["x"], "proof.png", { type: "image/png" });
    await apiUploadPaymentProof("tok", "c1", "p1", file);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    const file = new File(["x"], "proof.png", { type: "image/png" });
    await expect(apiUploadPaymentProof("tok", "c1", "p1", file)).rejects.toThrow(
      "Failed to upload payment proof",
    );
  });
});

describe("apiConfirmPayment", () => {
  it("200 confirms a payment", async () => {
    mockFetchOnce(200, { id: "p1", status: "PAID" });
    const result = await apiConfirmPayment("tok", "c1", "p1");
    expect(result.status).toBe("PAID");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiConfirmPayment("tok", "c1", "p1")).rejects.toThrow("Failed to confirm payment");
  });
});

describe("apiInviteToCampaign", () => {
  it("200 invites an influencer", async () => {
    mockFetchOnce(200, { id: "inv-1", inviteResult: "INVITED" });
    const result = await apiInviteToCampaign("tok", "camp-1", "inf-1");
    expect(result.inviteResult).toBe("INVITED");
  });

  it("non-ok throws with parsed error message", async () => {
    mockFetchOnce(409, { message: "This influencer has already applied to this campaign." }, false);
    await expect(apiInviteToCampaign("tok", "camp-1", "inf-1")).rejects.toThrow(
      "This influencer has already applied to this campaign.",
    );
  });
});

describe("apiGetInvitations", () => {
  it("200 returns invitations", async () => {
    mockFetchOnce(200, [{ id: "inv-1" }]);
    expect(await apiGetInvitations("tok")).toEqual([{ id: "inv-1" }]);
  });

  it("non-ok throws", async () => {
    mockFetchOnce(500, undefined, false);
    await expect(apiGetInvitations("tok")).rejects.toThrow("Failed to fetch invitations");
  });
});

describe("apiAcceptInvitation", () => {
  it("200 accepts an invitation", async () => {
    mockFetchOnce(200, { id: "inv-1", status: "ACCEPTED", conversationId: "c1" });
    const result = await apiAcceptInvitation("tok", "inv-1");
    expect(result.status).toBe("ACCEPTED");
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, undefined, false);
    await expect(apiAcceptInvitation("tok", "inv-1")).rejects.toThrow("Failed to accept invitation");
  });
});

describe("apiDeclineInvitation", () => {
  it("200 declines an invitation", async () => {
    mockFetchOnce(200, {});
    await expect(apiDeclineInvitation("tok", "inv-1")).resolves.toBeUndefined();
  });

  it("non-ok throws", async () => {
    mockFetchOnce(400, undefined, false);
    await expect(apiDeclineInvitation("tok", "inv-1")).rejects.toThrow("Failed to decline invitation");
  });
});
