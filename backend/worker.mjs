export default {
 async fetch(req, env) {
  const headers = {
   'Access-Control-Allow-Origin': env.SITE_ORIGIN,
   'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
   'Cache-Control': 'no-store',
  };
  const respond = (data, status=200) => Response.json(data, {headers,status});
  if (req.headers.get('Origin') && req.headers.get('Origin') !== env.SITE_ORIGIN) return respond({},403);
  if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
  const path = new URL(req.url).pathname;
  if (req.method === 'GET' && path === '/state') {
   const row = await env.DB.prepare('SELECT revision,data FROM site WHERE id=1').first();
   return respond({revision:row.revision,data:JSON.parse(row.data)});
  }
  if (req.method !== 'POST' || !['/login','/state'].includes(path)) return respond({},404);
  const attempt = await env.ATTEMPTS.limit({key:req.headers.get('CF-Connecting-IP') || 'unknown'});
  if (!attempt.success) return respond({},429);
  if (!env.ADMIN_PIN || req.headers.get('Authorization') !== 'Bearer ' + env.ADMIN_PIN) return respond({},401);
  if (path === '/login') return respond({ok:true});
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > 1450000) return respond({},413);
  let payload;
  try { payload = JSON.parse(raw); } catch { return respond({},400); }
  const {revision,data} = payload || {};
  const image = value => typeof value === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value);
  if (!Number.isSafeInteger(revision) || !data || !Array.isArray(data.texts) || data.texts.length > 180 ||
      !data.texts.every(value => typeof value === 'string' && value.length <= 3000) ||
      !Array.isArray(data.seats) || data.seats.length !== 19 || !data.seats.every(value => typeof value === 'boolean') ||
      !Array.isArray(data.images) || data.images.length > 40 || !data.images.every(value => value === null || image(value)) ||
      !Array.isArray(data.extra) || data.extra.length > 16 || !data.extra.every(image)) return respond({},400);
  const result = await env.DB.prepare('UPDATE site SET revision=revision+1,data=? WHERE id=1 AND revision=?')
    .bind(JSON.stringify(data),revision).run();
  return result.meta.changes ? respond({revision:revision+1}) : respond({},409);
 }
};
