import { Linking } from 'react-native';

export type PlanType = '1_day' | '7_day' | '14_day';

export type DeepLinkParams = {
  plan?: PlanType;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

const VALID_PLANS: PlanType[] = ['1_day', '7_day', '14_day'];

export function isValidPlan(plan: string): plan is PlanType {
  return VALID_PLANS.includes(plan as PlanType);
}

export function parseDeepLink(url: string): DeepLinkParams | null {
  try {
    // Handle both deep links (taxipilot://) and web URLs (https://)
    const urlObj = new URL(url);
    
    // Extract path for deep links (e.g., taxipilot://pricing)
    const path = urlObj.hostname || urlObj.pathname.slice(1);
    
    // Only process pricing-related links
    if (path !== 'pricing' && !url.includes('plan=')) {
      return null;
    }

    const params: DeepLinkParams = {};
    
    // Extract plan parameter
    const plan = urlObj.searchParams.get('plan');
    if (plan && isValidPlan(plan)) {
      params.plan = plan;
    }
    
    // Extract UTM parameters for analytics
    const utmSource = urlObj.searchParams.get('utm_source');
    if (utmSource) params.utmSource = utmSource;
    
    const utmMedium = urlObj.searchParams.get('utm_medium');
    if (utmMedium) params.utmMedium = utmMedium;
    
    const utmCampaign = urlObj.searchParams.get('utm_campaign');
    if (utmCampaign) params.utmCampaign = utmCampaign;
    
    return params;
  } catch {
    return null;
  }
}

export async function getInitialURL(): Promise<string | null> {
  return Linking.getInitialURL();
}

export function addDeepLinkListener(
  callback: (url: string) => void,
): { remove: () => void } {
  const subscription = Linking.addEventListener('url', (event) => {
    if (event.url) {
      callback(event.url);
    }
  });
  
  return {
    remove: () => subscription.remove(),
  };
}
