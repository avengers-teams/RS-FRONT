export function getAskWebsocketApiUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${window.location.host}${import.meta.env.VITE_API_BASE_URL}chat`;
  // console.log('getAskWebsocketApiUrl', url);
  return url;
}
