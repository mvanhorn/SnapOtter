export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www.snapotter.com") {
      url.hostname = "snapotter.com";
      return Response.redirect(url.toString(), 301);
    }

    const response = await env.ASSETS.fetch(request);

    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/data/")) {
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
