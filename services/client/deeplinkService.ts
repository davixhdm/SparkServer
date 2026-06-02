import DeepLink from '../../models/client/DeepLink';
import { getSettings } from '../../config/settings';
import { logger } from '../../utils/logger';

export async function resolveDeepLink(
  platform: 'spark' | 'vibe',
  name: string,
  params: Record<string, string> = {},
): Promise<string | null> {
  try {
    const settings = getSettings();
    const deeplinks = platform === 'spark' ? settings.deeplinks.sparkToVibe : settings.deeplinks.vibeToSpark;

    let urlTemplate = deeplinks[name];

    if (!urlTemplate) {
      const dbDeeplink = await DeepLink.findOne({ platform, name, isActive: true }).lean();
      if (dbDeeplink) {
        urlTemplate = dbDeeplink.urlScheme;
      }
    }

    if (!urlTemplate) {
      logger.warn('Deep link not found', { platform, name });
      return null;
    }

    let url = urlTemplate;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`{${key}}`, encodeURIComponent(value));
    }

    return url;
  } catch (error: any) {
    logger.error('Deep link resolution failed', { error: error.message });
    return null;
  }
}

export async function getDeepLinks(platform?: string): Promise<any[]> {
  const filter: any = { isActive: true };
  if (platform) filter.platform = platform;

  return DeepLink.find(filter).lean();
}

export function getSparkToVibeLinks(): Record<string, string> {
  const settings = getSettings();
  return settings.deeplinks.sparkToVibe || {};
}

export function getVibeToSparkLinks(): Record<string, string> {
  const settings = getSettings();
  return settings.deeplinks.vibeToSpark || {};
}