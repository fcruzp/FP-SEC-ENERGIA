import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/foro'] },
    sitemap: 'https://energia-fp.netlify.app/sitemap.xml',
  }
}
