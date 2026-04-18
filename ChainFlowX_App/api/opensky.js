export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const lamin = url.searchParams.get('lamin');
  const lomin = url.searchParams.get('lomin');
  const lamax = url.searchParams.get('lamax');
  const lomax = url.searchParams.get('lomax');

  if (!lamin || !lomin || !lamax || !lomax) {
    return new Response(JSON.stringify({ error: 'Missing bounding box params' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const openskyUrl = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

  const res = await fetch(openskyUrl, {
    headers: { 'User-Agent': 'ChainFlowX/2.0 Supply Chain Intelligence' },
  });
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=60',
    },
  });
}
