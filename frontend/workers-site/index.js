// Minimal Cloudflare Worker to serve static assets from the ./dist directory
export default {
  async fetch(request, env, ctx) {
    return env.ASSETS.fetch(request);
  },
};
