import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-vision-official.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = ['en', 'ku-bd', 'ku-so', 'ar', 'tr', 'fa', 'de', 'fr', 'es', 'ru', 'zh', 'hi'];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/auth`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/profile/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Localized pages
  const localizedPages: MetadataRoute.Sitemap = [];
  for (const page of staticPages) {
    for (const lang of languages) {
      localizedPages.push({
        ...page,
        url: `${page.url}?lang=${lang}`,
        priority: (page.priority || 1) * 0.8,
      });
    }
  }

  return [...staticPages, ...localizedPages];
}
