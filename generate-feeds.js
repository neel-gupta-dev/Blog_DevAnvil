const fs = require('fs');
const path = require('path');

const siteUrl = 'https://devanvil.pages.dev';
const postsPath = path.join(__dirname, 'data', 'posts.json');
const sitemapPath = path.join(__dirname, 'sitemap.xml');
const rssPath = path.join(__dirname, 'rss.xml');

// Helper to escape XML characters
const escapeXml = (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};

async function generateFeeds() {
    try {
        // Read posts and content data
        const postsData = fs.readFileSync(postsPath, 'utf-8');
        const posts = JSON.parse(postsData);
        
        // Sort posts by date, newest first
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        generateSitemap(posts);
        generateRssFeed(posts);

        console.log('✅ Sitemap and RSS feed generated successfully!');

    } catch (error) {
        console.error('❌ Error generating feeds:', error);
    }
}

function generateSitemap(posts) {
    const staticPages = ['/', '/blog', '/about', '/contact'];

    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapContent += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    staticPages.forEach(page => {
        sitemapContent += `  <url>\n`;
        sitemapContent += `    <loc>${siteUrl}${page}</loc>\n`;
        sitemapContent += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        sitemapContent += `    <changefreq>weekly</changefreq>\n`;
        sitemapContent += `  </url>\n`;
    });

    // Add blog posts
    posts.forEach(post => {
        sitemapContent += `  <url>\n`;
        sitemapContent += `    <loc>${siteUrl}${post.link}</loc>\n`;
        sitemapContent += `    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>\n`;
        sitemapContent += `    <changefreq>yearly</changefreq>\n`;
        sitemapContent += `  </url>\n`;
    });

    sitemapContent += `</urlset>`;

    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log(`📝 Sitemap written to ${sitemapPath}`);
}

function generateRssFeed(posts) {
    let rssContent = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
    rssContent += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
    rssContent += `<channel>\n`;
    rssContent += `  <title>DevAnvil</title>\n`;
    rssContent += `  <link>${siteUrl}</link>\n`;
    rssContent += `  <description>Tech &amp; Development Blogs</description>\n`;
    rssContent += `  <language>en-us</language>\n`;
    rssContent += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    rssContent += `  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />\n`;

    posts.forEach(post => {
        rssContent += `  <item>\n`;
        rssContent += `    <title>${escapeXml(post.title)}</title>\n`;
        rssContent += `    <link>${siteUrl}${post.link}</link>\n`;
        rssContent += `    <guid isPermaLink="true">${siteUrl}${post.link}</guid>\n`;
        rssContent += `    <pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`;
        rssContent += `    <description><![CDATA[${escapeXml(post.excerpt)}]]></description>\n`;
        rssContent += `  </item>\n`;
    });

    rssContent += `</channel>\n`;
    rssContent += `</rss>`;

    fs.writeFileSync(rssPath, rssContent);
    console.log(`📝 RSS feed written to ${rssPath}`);
}

generateFeeds();