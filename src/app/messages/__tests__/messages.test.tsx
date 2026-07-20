/**
 * Messages Page – Integration Tests
 *
 * Tests FE-05 through FE-07 for the Campaign ↔ Conversation integration feature.
 * Covers:
 *   FE-05: campaignName chip renders as a Link to /campaigns/[campaignId] in the conversation list
 *   FE-06: "View Campaign →" button appears in the open thread header when campaignId exists
 *   FE-07: "View Campaign →" link points to the correct /campaigns/[id] URL
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── socket.io-client mock ────────────────────────────────────────────────────
jest.mock('socket.io-client', () => ({
  io: () => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

// ─── Next.js mocks ───────────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={href} className={className} onClick={onClick} data-testid={`link-${href}`}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ─── Store mocks ──────────────────────────────────────────────────────────────
jest.mock('@/store/useUserStore', () => ({
  useUserStore: jest.fn(() => ({ role: 'brand', token: 'test-token', name: 'Test Brand User' })),
}));

// ─── ProcessOfWorkPanel mock ──────────────────────────────────────────────────
jest.mock('@/components/messages/process-of-work-panel', () => ({
  ProcessOfWorkPanel: () => <div data-testid="process-of-work-panel" />,
  WorkStatusDot: ({ phase }: { phase: string }) => <span data-testid={`status-dot-${phase}`} />,
  WorkStatusIndicator: ({ phase }: { phase: string }) => <span data-testid={`status-indicator-${phase}`} />,
}));

// ─── API mocks ────────────────────────────────────────────────────────────────
const mockApiGetConversations = jest.fn();
const mockApiGetMessages = jest.fn();
const mockApiGetConversation = jest.fn();
const mockApiMarkConversationRead = jest.fn();
const mockApiSendMessage = jest.fn();
const mockApiMarkPhaseReady = jest.fn();
const mockApiUploadConversationFile = jest.fn();
const mockApiGetConversationBrief = jest.fn();

jest.mock('@/lib/api', () => ({
  apiGetConversations: (...args: any[]) => mockApiGetConversations(...args),
  apiGetMessages: (...args: any[]) => mockApiGetMessages(...args),
  apiGetConversation: (...args: any[]) => mockApiGetConversation(...args),
  apiMarkConversationRead: (...args: any[]) => mockApiMarkConversationRead(...args),
  apiSendMessage: (...args: any[]) => mockApiSendMessage(...args),
  apiMarkPhaseReady: (...args: any[]) => mockApiMarkPhaseReady(...args),
  apiUploadConversationFile: (...args: any[]) => mockApiUploadConversationFile(...args),
  apiGetConversationBrief: (...args: any[]) => mockApiGetConversationBrief(...args),
}));

// ─── Test data ────────────────────────────────────────────────────────────────
// campaignId/campaignName are nullable in the real type — direct (non-campaign)
// conversations carry null. Typing the fixtures this way keeps them aligned with
// the app types.
type MockConversation = {
  id: string;
  partnerName: string;
  campaignId: string | null;
  campaignName: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  workPhase: string;
  brandPhaseReady: boolean;
  influencerPhaseReady: boolean;
};

const convWithCampaign: MockConversation = {
  id: 'conv-001',
  partnerName: 'Alice Influencer',
  campaignId: 'campaign-456',
  campaignName: 'Summer Splash Campaign',
  lastMessage: 'Looking forward to working with you!',
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  workPhase: 'contact',
  brandPhaseReady: false,
  influencerPhaseReady: false,
};

const convWithoutCampaign: MockConversation = {
  id: 'conv-002',
  partnerName: 'Bob Creator',
  campaignId: null,
  campaignName: null,
  lastMessage: 'Hi there!',
  lastMessageAt: new Date().toISOString(),
  unreadCount: 1,
  workPhase: 'contact',
  brandPhaseReady: false,
  influencerPhaseReady: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function renderMessagesPage(conversations: MockConversation[] = [convWithCampaign]) {
  mockApiGetConversations.mockResolvedValue(conversations);
  mockApiGetMessages.mockResolvedValue([]);
  mockApiGetConversation.mockResolvedValue({
    id: conversations[0]?.id ?? null,
    contractUrl: null,
    briefFileUrl: null,
    paymentProofUrl: null,
  });
  mockApiMarkConversationRead.mockResolvedValue(undefined);

  const { default: MessagesPage } = await import('../page');
  render(<MessagesPage />);

  // Wait for conversations to load (sidebar content appears)
  await waitFor(() => {
    expect(mockApiGetConversations).toHaveBeenCalled();
  });

  // Wait until the loading spinner is gone and the "Conversations" heading appears
  await waitFor(
    () => {
      // The aside header "Conversations" is always rendered once loading is done
      expect(screen.getByRole('heading', { name: /^Conversations$/i })).toBeInTheDocument();
    },
    { timeout: 3000 }
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MessagesPage – campaignName chip is a link (FE-05)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FE-05: campaignName renders as a link to /campaigns/[campaignId] in the conversation list', async () => {
    await renderMessagesPage([convWithCampaign]);

    // The campaign name should appear as a link anchor pointing to the campaign
    const campaignLink = screen.getByRole('link', { name: /summer splash campaign/i });
    expect(campaignLink).toBeInTheDocument();
    expect(campaignLink).toHaveAttribute('href', `/campaigns/${convWithCampaign.campaignId}`);
  });

  it('FE-05b: campaignName does NOT render as a link when campaignId is absent', async () => {
    await renderMessagesPage([convWithoutCampaign]);

    // There should be no link for this conversation's campaign
    const campaignLinks = screen.queryAllByRole('link', { name: /summer splash campaign/i });
    expect(campaignLinks).toHaveLength(0);
  });
});

describe('MessagesPage – View Campaign button in thread header (FE-06, FE-07)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FE-06: "View Campaign →" link appears in the open thread header when campaignId exists', async () => {
    await renderMessagesPage([convWithCampaign]);

    // The active conversation header should show a View Campaign link
    await waitFor(() => {
      const viewCampaignLink = screen.getByRole('link', { name: /view campaign/i });
      expect(viewCampaignLink).toBeInTheDocument();
    });
  });

  it('FE-07: the View Campaign link points to the correct /campaigns/[id] URL', async () => {
    await renderMessagesPage([convWithCampaign]);

    await waitFor(() => {
      const viewCampaignLink = screen.getByRole('link', { name: /view campaign/i });
      expect(viewCampaignLink).toHaveAttribute('href', `/campaigns/${convWithCampaign.campaignId}`);
    });
  });

  it('FE-06b: "View Campaign →" link does NOT appear when the active conversation has no campaignId', async () => {
    await renderMessagesPage([convWithoutCampaign]);

    await waitFor(() => {
      const viewCampaignLink = screen.queryByRole('link', { name: /view campaign/i });
      expect(viewCampaignLink).not.toBeInTheDocument();
    });
  });
});
