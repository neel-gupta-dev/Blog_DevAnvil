document.addEventListener('DOMContentLoaded', () => {

    // --- Theme (Dark/Light Mode) Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Apply the saved theme on page load
    if (localStorage.getItem('devAnvilTheme') === 'dark') {
        body.classList.add('dark-mode');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            // Save the user's preference
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('devAnvilTheme', 'dark');
            } else {
                localStorage.removeItem('devAnvilTheme');
            }
        });
    }

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

    // --- Read Time Estimator ---
    const calculateReadTime = (content) => {
        if (!content) return '1 min read'; // Default value

        // Strip HTML tags to get plain text, then count words
        const text = content.replace(/<[^>]+>/g, '');
        const words = text.trim().split(/\s+/).length;

        // Average reading speed: 225 words per minute
        const wordsPerMinute = 225;
        const readTime = Math.ceil(words / wordsPerMinute);

        return `${readTime} min read`;
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
            // Fetch both posts and content to calculate read time
            const [postsResponse, contentResponse] = await Promise.all([
                fetch('/data/posts.json'),
                fetch('/data/content.json')
            ]);

            if (!postsResponse.ok) throw new Error(`HTTP error! Status: ${postsResponse.status}`);
            if (!contentResponse.ok) throw new Error(`Failed to fetch content file: ${contentResponse.status}`);
            
            let posts = await postsResponse.json();
            const allContent = await contentResponse.json();
            
            // If a limit is set, slice the array
            const postsToDisplay = postLimit ? posts.slice(0, postLimit) : posts;

            if (postsToDisplay.length === 0) {
                postsGrid.innerHTML = '<p>No posts found.</p>';
                return;
            }

            const postsHtml = postsToDisplay.map(post => {
                const postContent = allContent[post.id];
                const readTime = calculateReadTime(postContent);
                return `
                    <article class="post-card">
                        <a href="${post.link}" class="card-image-link"><img src="${post.image}" alt="${post.imageAlt}" class="card-image" loading="lazy"></a>
                        <div class="card-content">
                            <span class="card-category">${post.category}</span>
                            <h2 class="card-title"><a href="${post.link}">${post.title}</a></h2>
                            <p class="card-excerpt">${post.excerpt}</p>
                            <div class="card-meta">
                                <span><i class="fas fa-user"></i> ${post.author}</span>
                                <div class="card-meta-right">
                                    <span><i class="fas fa-calendar-alt"></i> ${post.date}</span>
                                    <span class="card-read-time"><i class="fas fa-clock"></i> ${readTime}</span>
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

    // --- Search Functionality for Homepage ---
    const initHomepageSearch = () => {
        const searchForm = document.getElementById('home-search-form');
        const searchInput = document.getElementById('home-search-input');

        if (!searchForm || !searchInput) {
            return;
        }

        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // Redirect to the blog page with the search query
                window.location.href = `/blog?q=${encodeURIComponent(searchTerm)}`;
            }
        });
    };

    // --- Search Functionality for Blog Page ---
    const initBlogSearch = () => {
        const searchInput = document.getElementById('search-input');
        const postsGrid = document.querySelector('#all-posts-grid');

        if (!searchInput || !postsGrid) {
            return;
        }

        let allPosts = []; // Cache for all posts data
        let allContent = {}; // Cache for all content data

        const renderPosts = (postsToRender) => {
            if (postsToRender.length === 0) {
                if (searchInput.value.trim() !== '') {
                    postsGrid.innerHTML = '<p style="text-align: center;">No posts match your search.</p>';
                } else {
                    postsGrid.innerHTML = '<p style="text-align: center;">No posts found.</p>';
                }
                return;
            }

            const postsHtml = postsToRender.map(post => {
                const postContent = allContent[post.id];
                const readTime = calculateReadTime(postContent);
                return `
                    <article class="post-card">
                        <a href="${post.link}" class="card-image-link"><img src="${post.image}" alt="${post.imageAlt}" class="card-image" loading="lazy"></a>
                        <div class="card-content">
                            <span class="card-category">${post.category}</span>
                            <h2 class="card-title"><a href="${post.link}">${post.title}</a></h2>
                            <p class="card-excerpt">${post.excerpt}</p>
                            <div class="card-meta">
                                <span><i class="fas fa-user"></i> ${post.author}</span>
                                <div class="card-meta-right">
                                    <span><i class="fas fa-calendar-alt"></i> ${post.date}</span>
                                    <span class="card-read-time"><i class="fas fa-clock"></i> ${readTime}</span>
                                </div>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
            postsGrid.innerHTML = postsHtml;
        };
        
        const filterAndRender = (searchTerm) => {
            const lowerCaseTerm = searchTerm.toLowerCase().trim();
            const filteredPosts = allPosts.filter(post =>
                post.title.toLowerCase().includes(lowerCaseTerm) ||
                post.excerpt.toLowerCase().includes(lowerCaseTerm) ||
                post.category.toLowerCase().includes(lowerCaseTerm)
            );
            renderPosts(filteredPosts);
        };

        const initialize = async () => {
            try {
                const [postsResponse, contentResponse] = await Promise.all([
                    fetch('/data/posts.json'),
                    fetch('/data/content.json')
                ]);

                if (!postsResponse.ok) throw new Error(`HTTP error! Status: ${postsResponse.status}`);
                if (!contentResponse.ok) throw new Error(`Failed to fetch content file: ${contentResponse.status}`);
                allPosts = await postsResponse.json();
                allContent = await contentResponse.json();

                const urlParams = new URLSearchParams(window.location.search);
                const query = urlParams.get('q');
                
                if (query) {
                    const decodedQuery = decodeURIComponent(query);
                    searchInput.value = decodedQuery;
                    filterAndRender(decodedQuery);
                } else {
                    renderPosts(allPosts);
                }
            } catch (error) {
                console.error("Failed to load blog posts:", error);
                postsGrid.innerHTML = '<p style="text-align: center; color: #e74c3c;">Failed to load posts. Please try again later.</p>';
            }
        };

        searchInput.addEventListener('input', (e) => filterAndRender(e.target.value));

        initialize();
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
                const postHtmlContent = allContent[post.id];
                const readTime = calculateReadTime(postHtmlContent);
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

                // Populate the page content
                document.getElementById('post-category').textContent = post.category;
                document.getElementById('post-title').textContent = post.title;
                document.getElementById('post-meta').innerHTML = `
                    <span><i class="fas fa-user"></i> ${post.author}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${post.date}</span>
                    <span class="card-read-time"><i class="fas fa-clock"></i> ${readTime}</span>
                `;
                document.getElementById('post-image-container').innerHTML = `<img src="${post.image.replace('&w=400&h=250&fit=crop', '&w=1200&h=600&fit=crop')}" alt="${post.imageAlt}" loading="lazy">`;
                postContent.innerHTML = postHtmlContent || '<p>Content for this post is not available at the moment.</p>';

                // Apply syntax highlighting if highlight.js is loaded
                if (typeof hljs !== 'undefined') {
                    // Find all <pre> blocks within the post content
                    postContent.querySelectorAll('pre').forEach((preBlock) => {
                        // If there isn't a <code> tag inside, wrap the content with one.
                        // This makes highlighting more reliable.
                        if (!preBlock.querySelector('code')) {
                            preBlock.innerHTML = `<code>${preBlock.innerHTML}</code>`;
                        }
                    });
                    // Now highlight all code blocks within the post content
                    postContent.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
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
    // initBlogSearch now handles loading all posts on the blog page.
    initBlogSearch();
    initHomepageSearch();
    loadSinglePost();                  // For single post page
});