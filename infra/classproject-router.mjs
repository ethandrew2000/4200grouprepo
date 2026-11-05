export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== 'croftfamily.us' || (url.pathname !== '/classproject' && !url.pathname.startsWith('/classproject/'))) {
      return fetch(request);
    }
    if (url.pathname === '/classproject') {
      url.pathname = '/classproject/';
      return Response.redirect(url.toString(), 308);
    }
    url.hostname = 'classproject-production-15fc.up.railway.app';
    url.protocol = 'https:';
    url.port = '';
    const upstream = new Request(url, request);
    upstream.headers.delete('host');
    try {
      return await fetch(upstream, { redirect: 'manual' });
    } catch (error) {
      console.error(JSON.stringify({ event: 'classproject_upstream_error', message: error.message }));
      return new Response('Class project temporarily unavailable. Please try again.', { status: 502 });
    }
  }
};
