import DeepLink from '../../models/client/DeepLink';
import Settings from '../../models/admin/Settings';
import { refreshSettings } from '../../config/settings';
import { NotFoundError } from '../../utils/errors';

export async function getDeepLinks(platform?: string): Promise<any[]> {
  const filter: any = {};
  if (platform) filter.platform = platform;
  return DeepLink.find(filter).sort({ platform: 1, name: 1 }).lean();
}

export async function createDeepLink(data: {
  platform: 'spark' | 'vibe';
  name: string;
  description?: string;
  urlScheme: string;
  iosScheme?: string;
  androidScheme?: string;
  webFallback?: string;
  parameters?: Array<{ name: string; required: boolean; description: string }>;
}): Promise<any> {
  return DeepLink.create(data);
}

export async function updateDeepLink(
  deepLinkId: string,
  updates: Record<string, any>,
): Promise<any> {
  const deepLink = await DeepLink.findByIdAndUpdate(deepLinkId, updates, { new: true });
  if (!deepLink) throw new NotFoundError('Deep link not found');

  // Update settings cache
  await syncDeepLinksToSettings();

  return deepLink;
}

export async function deleteDeepLink(deepLinkId: string): Promise<void> {
  const deepLink = await DeepLink.findByIdAndDelete(deepLinkId);
  if (!deepLink) throw new NotFoundError('Deep link not found');

  await syncDeepLinksToSettings();
}

export async function toggleDeepLink(deepLinkId: string, isActive: boolean): Promise<any> {
  const deepLink = await DeepLink.findByIdAndUpdate(
    deepLinkId,
    { isActive },
    { new: true },
  );
  if (!deepLink) throw new NotFoundError('Deep link not found');

  await syncDeepLinksToSettings();
  return deepLink;
}

async function syncDeepLinksToSettings(): Promise<void> {
  try {
    const sparkLinks = await DeepLink.find({ platform: 'vibe', isActive: true }).lean();
    const vibeLinks = await DeepLink.find({ platform: 'spark', isActive: true }).lean();

    const sparkToVibe: Record<string, string> = {};
    for (const link of sparkLinks) {
      sparkToVibe[link.name] = link.urlScheme;
    }

    const vibeToSpark: Record<string, string> = {};
    for (const link of vibeLinks) {
      vibeToSpark[link.name] = link.urlScheme;
    }

    await Settings.findOneAndUpdate(
      {},
      {
        'deeplinks.sparkToVibe': sparkToVibe,
        'deeplinks.vibeToSpark': vibeToSpark,
      },
      { upsert: true },
    );

    await refreshSettings();
  } catch (error: any) {
    throw error;
  }
}