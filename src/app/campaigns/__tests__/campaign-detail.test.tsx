/**
 * Campaign Detail Page – Integration Tests
 *
 * Tests FE-01 through FE-04 for the Campaign ↔ Conversation integration feature.
 * Covers:
 *   FE-01: Message button renders on ACCEPTED rows when conversationId is present
 *   FE-02: Message button does NOT render on PENDING or REJECTED rows
 *   FE-03: Clicking Message button navigates to /messages?convId=xxx
 *   FE-04: After accepting an application the Message button appears without reload
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Next.js mocks ───────────────────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'campaign-123' }),
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ─── Store mocks ──────────────────────────────────────────────────────────────
jest.mock('@/store/useUserStore', () => ({
  useUserStore: jest.fn(() => ({ role: 'brand', token: 'test-token', name: 'Test Brand' })),
}));

jest.mock('@/store/useCampaignCollaborationStore', () => ({
  useCampaignCollaborationStore: jest.fn((selector: (s: any) => any) => {
    const state = { collaborations: [], recordCampaignFinished: jest.fn() };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// ─── Component mocks ──────────────────────────────────────────────────────────
jest.mock('@/components/CampaignPartnerReviews', () => ({
  CampaignPartnerReviews: () => <div data-testid="partner-reviews" />,
}));

// ─── Library mocks ────────────────────────────────────────────────────────────
jest.mock('@/lib/influencer-platforms', () => ({
  getMainFollowerPlatform: () => ({ platform: 'Instagram', followers: 10000 }),
}));

jest.mock('@/lib/excel', () => ({
  exportRowsToExcel: jest.fn(),
}));

// ─── API mocks ────────────────────────────────────────────────────────────────
const mockApiGetCampaign = jest.fn();
const mockApiGetCampaignApplications = jest.fn();
const mockApiGetPublicCampaigns = jest.fn();
const mockApiUpdateCampaign = jest.fn();
const mockApiUpdateCampaignApplicationStatus = jest.fn();
const mockApiApplyToCampaign = jest.fn();

jest.mock('@/lib/api', () => ({
  apiGetCampaign: (...args: any[]) => mockApiGetCampaign(...args),
  apiGetCampaignApplications: (...args: any[]) => mockApiGetCampaignApplications(...args),
  apiGetPublicCampaigns: (...args: any[]) => mockApiGetPublicCampaigns(...args),
  apiUpdateCampaign: (...args: any[]) => mockApiUpdateCampaign(...args),
  apiUpdateCampaignApplicationStatus: (...args: any[]) => mockApiUpdateCampaignApplicationStatus(...args),
  apiApplyToCampaign: (...args: any[]) => mockApiApplyToCampaign(...args),
  CampaignStatus: {},
}));

// ─── Test data ────────────────────────────────────────────────────────────────
const mockCampaign = {
  id: 'campaign-123',
  name: 'Test Campaign',
  status: 'ACTIVE',
  visibility: 'PUBLIC',
  objective: 'Awareness',
  budget: 100000,
  paymentType: 'Per post',
  keyMessage: 'Buy our product',
  deliverables: '5 posts',
  doAndDont: 'Be authentic',
  applyDeadline: '2026-12-01T00:00:00.000Z',
  submissionDate: '2026-12-15T00:00:00.000Z',
  reviewDate: '2026-12-20T00:00:00.000Z',
  paymentDate: '2026-12-31T00:00:00.000Z',
  requirements: [],
  clientBrand: { brandName: 'TestBrand Co.' },
  applications: [],
};

// conversationId is nullable in the real type — only ACCEPTED rows with a
// conversation get one; PENDING/REJECTED rows carry null. platformAccounts may
// be empty. Typing the fixtures this way keeps them aligned with the app types.
type MockApplication = {
  id: string;
  status: string;
  conversationId: string | null;
  influencer: {
    user: { name: string; email: string };
    platformAccounts: { platform: string; handle: string }[];
  };
};

const acceptedApplication: MockApplication = {
  id: 'app-001',
  status: 'ACCEPTED',
  conversationId: 'conv-abc',
  influencer: {
    user: { name: 'Alice Influencer', email: 'alice@test.com' },
    platformAccounts: [{ platform: 'Instagram', handle: 'alice_ig' }],
  },
};

const pendingApplication: MockApplication = {
  id: 'app-002',
  status: 'PENDING',
  conversationId: null,
  influencer: {
    user: { name: 'Bob Creator', email: 'bob@test.com' },
    platformAccounts: [],
  },
};

const rejectedApplication: MockApplication = {
  id: 'app-003',
  status: 'REJECTED',
  conversationId: null,
  influencer: {
    user: { name: 'Carol Maker', email: 'carol@test.com' },
    platformAccounts: [],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function renderCampaignPage(applications: MockApplication[] = [acceptedApplication]) {
  mockApiGetCampaign.mockResolvedValue(mockCampaign);
  mockApiGetCampaignApplications.mockResolvedValue(applications);

  // Dynamic import to get fresh module after mocks are set
  const { default: CampaignDetailPage } = await import('../[id]/page');
  render(<CampaignDetailPage />);

  // Wait for loading to finish — the campaign name paragraph appears after data loads
  await waitFor(() => {
    expect(mockApiGetCampaign).toHaveBeenCalled();
    // The "Campaign management" heading appears once data is loaded for brand role
    expect(screen.getByText('Campaign management')).toBeInTheDocument();
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CampaignDetailPage – Message button visibility (FE-01, FE-02)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FE-01: renders a Message button for an ACCEPTED application that has a conversationId', async () => {
    await renderCampaignPage([acceptedApplication]);

    const messageButtons = screen.getAllByRole('button', { name: /message/i });
    expect(messageButtons.length).toBeGreaterThan(0);
  });

  it('FE-02: does NOT render a Message button for a PENDING application', async () => {
    await renderCampaignPage([pendingApplication]);

    expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument();
  });

  it('FE-02b: does NOT render a Message button for a REJECTED application', async () => {
    await renderCampaignPage([rejectedApplication]);

    expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument();
  });

  it('FE-02c: does NOT render a Message button for an ACCEPTED application with no conversationId', async () => {
    const acceptedNoConv = { ...acceptedApplication, conversationId: null };
    await renderCampaignPage([acceptedNoConv]);

    expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument();
  });
});

describe('CampaignDetailPage – Message button navigation (FE-03)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FE-03: clicking Message button calls router.push with the correct /messages?convId= URL', async () => {
    await renderCampaignPage([acceptedApplication]);

    const messageButton = screen.getByRole('button', { name: /message/i });
    fireEvent.click(messageButton);

    expect(mockPush).toHaveBeenCalledWith(`/messages?convId=${acceptedApplication.conversationId}`);
  });
});

describe('CampaignDetailPage – Optimistic update after accepting (FE-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FE-04: Message button appears immediately after accepting a pending application without reload', async () => {
    // Start with a PENDING application — no Message button yet
    await renderCampaignPage([pendingApplication]);
    expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument();

    // Mock the accept API call to return conversationId
    const newConvId = 'conv-newly-created';
    mockApiUpdateCampaignApplicationStatus.mockResolvedValue({
      id: pendingApplication.id,
      status: 'ACCEPTED',
      conversationId: newConvId,
    });

    // Click Accept button for Bob Creator
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    fireEvent.click(acceptButtons[0]);

    // Message button should appear without any page reload
    await waitFor(() => {
      const messageButton = screen.queryByRole('button', { name: /message/i });
      expect(messageButton).toBeInTheDocument();
    });

    // And router push should NOT have been called (no navigation, just state update)
    expect(mockPush).not.toHaveBeenCalled();
  });
});
