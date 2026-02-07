const fs = require('fs');
const path = require('path');

// Define project paths
const rootDir = __dirname;
const postsJsonPath = path.join(rootDir, 'data', 'posts.json');
const contentJsonPath = path.join(rootDir, 'data', 'content.json');
const templatePath = path.join(rootDir, 'post.html');
const outputDir = path.join(rootDir, 'posts');

/**
 * Calculates the estimated reading time for a piece of content.
 * @param {string} content - The HTML content of the post.
 * @returns {string} - The estimated read time (e.g., "5 min read").
 */
const calculateReadTime = (content) => {
    if (!content) return '1 min read';
    const text = content.replace(/<[^>]+>/g, ''); // Strip HTML tags
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 225;
    const readTime = Math.ceil(words / wordsPerMinute);
    return `${readTime} min read`;
};

/**
 * Generates static HTML pages for each blog post.
 */
function generateStaticPostPages() {
    try {
        // 1. Read data sources and the HTML template
        console.log('Reading data and template...');
        const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
        const allContent = JSON.parse(fs.readFileSync(contentJsonPath, 'utf-8'));
        const template = fs.readFileSync(templatePath, 'utf-8');

        // 2. Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            console.log(`Creating output directory: ${outputDir}`);
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`Found ${posts.length} posts to generate.`);

        // 3. Generate a static page for each post
        for (const post of posts) {
            const postContent = allContent[post.id];
            if (!postContent) {
                console.warn(`- Skipping post "${post.title}" due to missing content.`);
                continue;
            }

            let postPageHtml = template;

            const readTime = calculateReadTime(postContent);
            const siteUrl = 'https://devanvil.pages.dev';
            const logicalPostUrl = `/posts/${post.slug}`; // The desired clean URL structure
            const absolutePostUrl = siteUrl + logicalPostUrl;
            const largeImageUrl = post.image.replace('&w=400&h=250&fit=crop', '&w=1200&h=600&fit=crop');

            // 4. Replace all placeholders in the template with actual post data
            
            // --- SEO & Meta Tags ---
            postPageHtml = postPageHtml.replace(/<title>.*<\/title>/, `<title>${post.title.replace(/"/g, '&quot;')} - DevAnvil</title>`);
            postPageHtml = postPageHtml.replace(/<meta name="description" content=".*">/, `<meta name="description" content="${post.excerpt.replace(/"/g, '&quot;')}">`);
            postPageHtml = postPageHtml.replace(/<link rel="canonical" href=".*" \/>/, `<link rel="canonical" href="${absolutePostUrl}" />`);
            
            // --- Open Graph & Twitter Tags ---
            postPageHtml = postPageHtml.replace(/<meta property="og:url" content=".*">/, `<meta property="og:url" content="${absolutePostUrl}">`);
            postPageHtml = postPageHtml.replace(/<meta property="og:title" content=".*">/, `<meta property="og:title" content="${post.title.replace(/"/g, '&quot;')}">`);
            postPageHtml = postPageHtml.replace(/<meta property="og:description" content=".*">/, `<meta property="og:description" content="${post.excerpt.replace(/"/g, '&quot;')}">`);
            postPageHtml = postPageHtml.replace(/<meta property="og:image" content=".*">/, `<meta property="og:image" content="${largeImageUrl}">`);
            postPageHtml = postPageHtml.replace(/<meta property="twitter:url" content=".*">/, `<meta property="twitter:url" content="${absolutePostUrl}">`);
            postPageHtml = postPageHtml.replace(/<meta property="twitter:title" content=".*">/, `<meta property="twitter:title" content="${post.title.replace(/"/g, '&quot;')}">`);
            postPageHtml = postPageHtml.replace(/<meta property="twitter:description" content=".*">/, `<meta property="twitter:description" content="${post.excerpt.replace(/"/g, '&quot;')}">`);
            postPageHtml = postPageHtml.replace(/<meta property="twitter:image" content=".*">/, `<meta property="twitter:image" content="${largeImageUrl}">`);

            // --- JSON-LD Schema ---
            const schema = {
                "@context": "https://schema.org", "@type": "BlogPosting", "headline": post.title, "image": largeImageUrl,
                "author": { "@type": "Person", "name": post.author },
                "publisher": { "@type": "Organization", "name": "DevAnvil", "logo": { "@type": "ImageObject", "url": `${siteUrl}/images/og-image.jpg` }},
                "datePublished": new Date(post.date).toISOString(), "dateModified": new Date(post.date).toISOString(), "description": post.excerpt
            };
            postPageHtml = postPageHtml.replace(/<script type="application\/ld\+json" id="post-schema"><\/script>/, `<script type="application/ld+json" id="post-schema">${JSON.stringify(schema)}</script>`);

            // --- Page Content ---
            postPageHtml = postPageHtml.replace('<span id="post-category" class="card-category"></span>', `<span id="post-category" class="card-category">${post.category}</span>`);
            postPageHtml = postPageHtml.replace(/<h1 id="post-title" class="post-full-title">.*<\/h1>/, `<h1 id="post-title" class="post-full-title">${post.title}</h1>`);
            const metaHtml = `
                    <span><i class="fas fa-user"></i> ${post.author}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${post.date}</span>
                    <span class="card-read-time"><i class="fas fa-clock"></i> ${readTime}</span>
            `;
            postPageHtml = postPageHtml.replace(/<div id="post-meta" class="post-full-meta">([\s\S]*?)<\/div>/, `<div id="post-meta" class="post-full-meta">${metaHtml}</div>`);
            postPageHtml = postPageHtml.replace(/<figure id="post-image-container" class="post-full-image">([\s\S]*?)<\/figure>/, `<figure id="post-image-container" class="post-full-image"><img src="${largeImageUrl}" alt="${post.imageAlt}" loading="lazy"></figure>`);
            postPageHtml = postPageHtml.replace(/<section id="post-content" class="post-full-content">([\s\S]*?)<\/section>/, `<section id="post-content" class="post-full-content">${postContent}</section>`);

            // 5. Write the final HTML to a new file
            const outputPath = path.join(outputDir, `${post.slug}.html`);
            fs.writeFileSync(outputPath, postPageHtml);
            console.log(`  -> Successfully generated: ${outputPath}`);
        }

        console.log('\n✅ All post pages generated successfully!');

    } catch (error) {
        console.error('❌ Error generating static post pages:', error);
        process.exit(1); // Exit with an error code
    }
}

generateStaticPostPages();