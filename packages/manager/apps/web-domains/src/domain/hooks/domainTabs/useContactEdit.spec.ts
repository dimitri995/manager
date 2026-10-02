import '@/common/setupTests';
import { vi, describe, it, beforeEach, expect, Mock } from 'vitest';
import { act, renderHook, waitFor } from '@/common/utils/test.provider';
import {
  postDomainConfigurationRuleCheck,
  putDomainContact,
} from '@/domain/data/api/domainContact';
import { useUpdateContactMutation } from './useContactEdit';

vi.mock('@/domain/data/api/domainContact', () => ({
  getDomainConfigurationRule: vi.fn(),
  postDomainConfigurationRuleCheck: vi.fn(),
  putDomainContact: vi.fn(),
}));

const body = {
  legalForm: 'individual',
  nationalIdentificationNumber: 'ABCDEF00A00A000A',
};

type UpdateContactResult = {
  current: ReturnType<typeof useUpdateContactMutation>;
};

// renderUpdateContact renders the hook; the test provider's renderHook is untyped.
const renderUpdateContact = (action?: string) =>
  renderHook(() =>
    useUpdateContactMutation('contact-123', 'example.it', action),
  ) as unknown as { result: UpdateContactResult };

describe('useUpdateContactMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (postDomainConfigurationRuleCheck as Mock).mockResolvedValue(undefined);
    (putDomainContact as Mock).mockResolvedValue(body);
  });

  it('should check the contact against the update rules by default', async () => {
    const { result } = renderUpdateContact();

    act(() => result.current.updateContact(body));

    await waitFor(() =>
      expect(putDomainContact).toHaveBeenCalledWith('contact-123', body),
    );
    expect(postDomainConfigurationRuleCheck).toHaveBeenCalledWith(
      'update',
      'example.it',
      { owner: body },
    );
  });

  it('should check the new holder of a trade against the trade rules', async () => {
    const { result } = renderUpdateContact('trade');

    act(() => result.current.updateContact(body));

    await waitFor(() =>
      expect(putDomainContact).toHaveBeenCalledWith('contact-123', body),
    );
    expect(postDomainConfigurationRuleCheck).toHaveBeenCalledWith(
      'trade',
      'example.it',
      { owner: body },
    );
  });

  it('should not update the contact when the rule check fails', async () => {
    (postDomainConfigurationRuleCheck as Mock).mockRejectedValue(
      new Error('readonly'),
    );
    const { result } = renderUpdateContact('trade');

    act(() => result.current.updateContact(body));

    await waitFor(() =>
      expect(result.current.updateContactError).toBeTruthy(),
    );
    expect(putDomainContact).not.toHaveBeenCalled();
  });
});
