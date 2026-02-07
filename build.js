const { execSync } = require('child_process');

console.log('🚀 Starting build process...');

try {
    // Run scripts in sequence. The `stdio: 'inherit'` option shows the output
    // of the child scripts in the console, which is helpful for debugging.

    console.log('\n[1/2] Generating static post pages...');
    execSync('node generate-posts.js', { stdio: 'inherit' });

    console.log('\n[2/2] Generating sitemap and RSS feeds...');
    execSync('node generate-feeds.js', { stdio: 'inherit' });

    console.log('\n✅ Build process completed successfully!');
} catch (error) {
    console.error('\n❌ Build process failed. Check the errors above.');
    process.exit(1);
}