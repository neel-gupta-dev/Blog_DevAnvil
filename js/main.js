document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Menu (Hamburger) Logic ---
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });
    }

    // --- Dynamic Copyright Year ---
    const copyrightYear = document.getElementById("copyright-year");
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }

    // --- View Counter Logic ---
    const getViewCounts = () => {
        // Safely get and parse view counts from localStorage
        try {
            const counts = localStorage.getItem('devAnvilViewCounts');
            return counts ? JSON.parse(counts) : {};
        } catch (e) {
            console.error("Error reading view counts from localStorage", e);
            return {}; // Return empty object on error
        }
    };

    const saveViewCounts = (counts) => {
        localStorage.setItem('devAnvilViewCounts', JSON.stringify(counts));
    };

    const incrementViewCount = (postId) => {
        if (!postId) return;
        const viewCounts = getViewCounts();
        viewCounts[postId] = (viewCounts[postId] || 0) + 1;
        saveViewCounts(viewCounts);
    };

    // Helper function to set meta tags
    const setMetaTag = (property, content, isProperty = true) => {
        let selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
        let tag = document.querySelector(selector);
        if (!tag) {
            tag = document.createElement('meta');
            if (isProperty) {
                tag.setAttribute('property', property);
            } else {
                tag.setAttribute('name', property);
            }
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    };

    // Helper function to set link tags (like canonical)
    const setLinkTag = (rel, href) => {
        let tag = document.querySelector(`link[rel="${rel}"]`);
        if (!tag) {
            tag = document.createElement('link');
            tag.setAttribute('rel', rel);
            document.head.appendChild(tag);
        }
        tag.setAttribute('href', href);
    };

    // --- Generic Post Loader ---
    const loadPosts = async (gridSelector, postLimit = null) => {
        const postsGrid = document.querySelector(gridSelector);
        if (!postsGrid) return;

        try {
            const response = await fetch('/data/posts.json');

            const viewCounts = getViewCounts();
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            let posts = await response.json();
            
            // If a limit is set, slice the array
            const postsToDisplay = postLimit ? posts.slice(0, postLimit) : posts;

            if (postsToDisplay.length === 0) {
                postsGrid.innerHTML = '<p>No posts found.</p>';
                return;
            }

            const postsHtml = postsToDisplay.map(post => {
                const views = viewCounts[post.id] || 0;
                return `
                    <article class="post-card">
                        <a href="${post.link}" class="card-image-link"><img src="${post.image}" alt="${post.imageAlt}" class="card-image"></a>
                        <div class="card-content">
                            <span class="card-category">${post.category}</span>
                            <h2 class="card-title"><a href="${post.link}">${post.title}</a></h2>
                            <p class="card-excerpt">${post.excerpt}</p>
                            <div class="card-meta">
                                <span><i class="fas fa-user"></i> ${post.author}</span>
                                <div class="card-meta-right">
                                    <span><i class="fas fa-calendar-alt"></i> ${post.date}</span>
                                    <span class="card-views"><i class="fas fa-eye"></i> ${views}</span>
                                </div>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');

            postsGrid.innerHTML = postsHtml;
        } catch (error) {
            console.error("Failed to load blog posts:", error);
            postsGrid.innerHTML = '<p style="text-align: center; color: #e74c3c;">Failed to load posts. Please try again later.</p>';
        }
    };

    // --- Load Single Post from JSON ---
    const loadSinglePost = async () => {
        const postContent = document.querySelector('#post-content');
        if (!postContent) return; // Not on a single post page

        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (!slug) {
            document.getElementById('post-title').textContent = 'Post Not Found';
            postContent.innerHTML = '<p>Sorry, we couldn\'t find the post you were looking for. It might have been moved or deleted.</p>';
            return;
        }

        try {
            // Fetch both posts metadata and content in parallel from the /data folder
            const [postsResponse, contentResponse] = await Promise.all([
                fetch('/data/posts.json'),
                fetch('/data/content.json')
            ]);

            if (!postsResponse.ok) throw new Error(`HTTP error! Status: ${postsResponse.status}`);
            if (!contentResponse.ok) throw new Error(`Failed to fetch content file: ${contentResponse.status}`);
            
            const posts = await postsResponse.json();
            const allContent = await contentResponse.json();

            const post = posts.find(p => p.slug === slug);

            if (post) {
                // Increment view count for this post
                incrementViewCount(post.id);
                const viewCounts = getViewCounts();
                const views = viewCounts[post.id] || 1; // Start at 1 for the current view

                // Update page title and meta description for SEO
                document.title = `${post.title} - DevAnvil`;
                setMetaTag('description', post.excerpt, false); // name="description"

                // Dynamic Canonical URL
                const absolutePostUrl = window.location.origin + post.link;
                setLinkTag('canonical', absolutePostUrl);

                // Open Graph / Facebook
                setMetaTag('og:type', 'article'); // Ensure it's 'article' for a post
                setMetaTag('og:url', absolutePostUrl);
                setMetaTag('og:title', post.title);
                setMetaTag('og:description', post.excerpt);
                setMetaTag('og:image', post.image.replace('&w=400&h=250&fit=crop', '&w=1200&h=600&fit=crop')); // Use larger image for social

                // X (Twitter)
                setMetaTag('twitter:url', absolutePostUrl);
                setMetaTag('twitter:title', post.title);
                setMetaTag('twitter:description', post.excerpt);
                setMetaTag('twitter:image', post.image.replace('&w=400&h=250&fit=crop', '&w=1200&h=600&fit=crop')); // Use larger image for social

                // Structured Data (JSON-LD) for SEO
                const schema = {
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    "headline": post.title,
                    "image": post.image.replace('&w=400&h=250&fit=crop', '&w=1200&h=600&fit=crop'),
                    "author": {
                        "@type": "Person",
                        "name": post.author
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "DevAnvil",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://devanvil.pages.dev/images/og-image.jpg" // Replace with a real logo URL
                        }
                    },
                    "datePublished": new Date(post.date).toISOString(),
                    "dateModified": new Date(post.date).toISOString(),
                    "description": post.excerpt
                };
                document.getElementById('post-schema').textContent = JSON.stringify(schema);

                const postHtmlContent = allContent[post.id];
                
                // Populate the page content
                document.getElementById('post-category').textContent = post.category;
                document.getElementById('post-title').textContent = post.title;
                document.getElementById('post-meta').innerHTML = `
                    <span><i class="fas fa-user"></i> ${post.author}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${post.date}</span>
                    <span class="card-views"><i class="fas fa-eye"></i> ${views}</span>
                `;
                document.getElementById('post-image-container').innerHTML = `<img src="${post.image.replace('&w=400&h=250&fit=crop', '&w=1200&h=600&fit=crop')}" alt="${post.imageAlt}">`;
                postContent.innerHTML = postHtmlContent || '<p>Content for this post is not available at the moment.</p>';

            } else {
                document.getElementById('post-title').textContent = 'Post Not Found';
                postContent.innerHTML = '<p>Sorry, we couldn\'t find the post you were looking for. The requested post does not exist.</p>';
            }
        } catch (error) {
            console.error("Failed to load single post:", error);
            document.getElementById('post-title').textContent = 'Error';
            postContent.innerHTML = `
                <p style="text-align: center; color: #e74c3c; margin-top: 2rem;">
                    There was an error loading the post content. Please try again later.
                    <br>
                    <strong>Error details:</strong> ${error.message || error}
                    <br>
                    If you are running this locally, ensure you are using a local web server (e.g., 'npx serve' or 'python -m http.server').
                </p>
            `;
        }
    };

    // Load posts based on which page we are on
    loadPosts('#latest-posts-grid', 3); // For homepage
    loadPosts('#all-posts-grid');      // For blog page
    loadSinglePost();                  // For single post page
});