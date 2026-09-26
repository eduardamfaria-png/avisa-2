import type { AlertSettingKey, AlertLevel, UserPreference } from './types';

export const DEFAULT_ALERT_SETTINGS: Record<AlertSettingKey, AlertLevel> = {
  new_events: 'always',
  sales_open: 'always',
  price_drop: 'always',
  price_increase: 'important',
  new_lowest: 'always',
  batch_change: 'always',
  sold_out: 'always',
  resale: 'always',
  opportunities: 'important',
};

export function defaultPreferences(): UserPreference {
  return { homeCityId: null, cityIds: [], travel: 'other_cities', budget: null, alertSettings: { ...DEFAULT_ALERT_SETTINGS } };
}
