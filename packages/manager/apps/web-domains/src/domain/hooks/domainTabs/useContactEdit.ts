import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getDomainConfigurationRule,
  postDomainConfigurationRuleCheck,
  putDomainContact,
} from '@/domain/data/api/domainContact';
import {
  TConfigurationRule,
  TConfigurationRuleField,
} from '@/domain/types/contactEdit';
import { TDomainContact } from '@/common/types/common.types';
import { FIELD_NAME_LIST, OWNER_CONTACT_LABEL, CONFIGURATION_RULE_ACTIONS } from '@/domain/constants/contactEdit';

export const useGetConfigurationRule = (
  action: string,
  domain: string,
  options?: { enabled?: boolean },
) => {
  const { data, isLoading, error } = useQuery<TConfigurationRule>({
    queryKey: ['domain', 'configurationRule', action, domain],
    queryFn: async () => {
      const rules = await getDomainConfigurationRule(action, domain);
      let r = rules;
      if (rules.and) {
        r = rules.and.find(
          (rule: TConfigurationRule) => rule.label === OWNER_CONTACT_LABEL,
        );
      }

      r.fields.and.sort((a: TConfigurationRuleField, b: TConfigurationRuleField) => {
        const fieldValues = Object.values(FIELD_NAME_LIST);
        return fieldValues.indexOf(a.label) - fieldValues.indexOf(b.label);
      });

      return r;
    },
    enabled: options?.enabled ?? true,
  });
  return {
    rules: data,
    isRulesLoading: isLoading,
    rulesError: error,
  };
};

/**
 * Updates a contact after checking it against the rules of the domain for
 * action: update for the current holder of the domain, trade for the new
 * holder of a pending trade (see contactEdit).
 */
export const useUpdateContactMutation = (
  holderId: string,
  serviceName: string,
  action: string = CONFIGURATION_RULE_ACTIONS.UPDATE,
) => {
  const { mutate, isPending, error } = useMutation<
    TDomainContact,
    Error,
    Partial<TDomainContact>
  >({
    mutationKey: ['domain', 'contact', 'update', holderId, action],
    mutationFn: async (body: Partial<TDomainContact>) => {
      await postDomainConfigurationRuleCheck(action, serviceName, {
        owner: body,
      });
      return putDomainContact(holderId, body);
    },
  });

  return {
    updateContact: mutate,
    isUpdateContactPending: isPending,
    updateContactError: error,
  };
};
