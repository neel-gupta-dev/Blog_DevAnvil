const fs = require('fs');
const path = require('path');

const siteUrl = 'https://devanvil.pages.dev';
const postsPath = path.join(__dirname, 'data', 'posts.json');
const contentPath = path.join(__dirname, 'data', 'content.json'); // Add path to content.json
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

        const contentData = fs.readFileSync(contentPath, 'utf-8'); // Read content data
        const allContent = JSON.parse(contentData);
        
        // Sort posts by date, newest first
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        generateSitemap(posts);
        generateRssFeed(posts, allContent); // Pass allContent to generateRssFeed

        console.log('✅ Sitemap and RSS feed generated successfully!');

    } catch (error) {
        console.error('❌ Error generating feeds:', error);
    }
}

function generateSitemap(posts) {
    const staticPages = ['/', '/blog', '/about', '/contact'];
    const staticPagePriorities = {
        '/': '1.0', // Homepage is most important
        '/blog': '0.8', // Blog listing page
        '/about': '0.7',
        '/contact': '0.7'
    };

    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapContent += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    staticPages.forEach(page => {
        sitemapContent += `  <url>\n`;
        sitemapContent += `    <loc>${siteUrl}${page}</loc>\n`;
        sitemapContent += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        sitemapContent += `    <changefreq>weekly</changefreq>\n`;
        sitemapContent += `    <priority>${staticPagePriorities[page] || '0.5'}</priority>\n`; // Assign priority
        sitemapContent += `  </url>\n`;
    });

    // Add blog posts
    posts.forEach(post => {
        sitemapContent += `  <url>\n`;
        sitemapContent += `    <loc>${siteUrl}${post.link}</loc>\n`;
        sitemapContent += `    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>\n`; // Use post date for last modification
        sitemapContent += `    <changefreq>monthly</changefreq>\n`; // Suggest more frequent checks for blog posts
        sitemapContent += `    <priority>0.9</priority>\n`; // Blog posts are highly important
        sitemapContent += `  </url>\n`;
    });

    sitemapContent += `</urlset>`;

    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log(`📝 Sitemap written to ${sitemapPath}`);
}

function generateRssFeed(posts, allContent) { // Accept allContent
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
        rssContent += `    <pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`; // Use post.date for pubDate
        rssContent += `    <description><![CDATA[${allContent[post.id] ? allContent[post.id] : escapeXml(post.excerpt)}]]></description>\n`; // Use full content, fallback to excerpt
        rssContent += `  </item>\n`;
    });

    rssContent += `</channel>\n`;
    rssContent += `</rss>`;

    fs.writeFileSync(rssPath, rssContent);
    console.log(`📝 RSS feed written to ${rssPath}`);
}

generateFeeds();