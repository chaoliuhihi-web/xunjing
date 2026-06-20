import { submitLead } from './leadSubmission';

const sampleLead = {
  name: '王女士',
  phone: '13800138000',
  company: '新疆文旅示范中心',
  type: '景区 AI 导览样板',
  message: '希望预约演示'
};

describe('lead submission', () => {
  beforeEach(() => {
    window.XINGHE_SITE_CONFIG = {};
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  test('stores leads locally when no webhook endpoint is configured', async () => {
    const result = await submitLead(sampleLead, { source: 'modal' });

    const stored = JSON.parse(window.localStorage.getItem('xinghe_xunjing_leads'));
    expect(result).toEqual({ ok: true, mode: 'local' });
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      ...sampleLead,
      source: 'modal',
      status: 'pending-sync'
    });
    expect(stored[0].submittedAt).toMatch(/T/);
  });

  test('posts leads to the runtime configured webhook endpoint', async () => {
    window.XINGHE_SITE_CONFIG = {
      leadWebhookUrl: 'https://crm.example.test/xinghe/leads'
    };
    const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      status: 200
    });

    const result = await submitLead(sampleLead, { source: 'contact-section' });

    expect(result).toEqual({ ok: true, mode: 'webhook' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://crm.example.test/xinghe/leads',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toMatchObject({
      ...sampleLead,
      source: 'contact-section',
      status: 'new'
    });
    expect(window.localStorage.getItem('xinghe_xunjing_leads')).toBeNull();
  });

  test('returns a customer-safe error when the webhook rejects the lead', async () => {
    window.XINGHE_SITE_CONFIG = {
      leadWebhookUrl: 'https://crm.example.test/xinghe/leads'
    };
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: false,
      status: 500
    });

    await expect(submitLead(sampleLead, { source: 'modal' })).rejects.toThrow(
      'LEAD_WEBHOOK_FAILED'
    );
  });
});
