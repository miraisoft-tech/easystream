import http from 'http';
import { WebSocket } from 'ws';

async function testServer() {
  console.log('Testing server endpoints and WebSocket commands...');

  // 1. Test Manifest
  const manifestRes = await fetch('http://127.0.0.1:3000/manifest.json');
  console.log('GET /manifest.json status:', manifestRes.status);
  const manifestData = await manifestRes.json();
  console.log('Manifest name:', manifestData.name, 'start_url:', manifestData.start_url);

  // 2. Test Service Worker
  const swRes = await fetch('http://127.0.0.1:3000/sw.js');
  console.log('GET /sw.js status:', swRes.status, 'contentType:', swRes.headers.get('content-type'));

  // 3. Test Icons
  const iconSvg = await fetch('http://127.0.0.1:3000/icon.svg');
  const iconPng = await fetch('http://127.0.0.1:3000/icon-192.png');
  console.log('GET /icon.svg status:', iconSvg.status, 'GET /icon-192.png status:', iconPng.status);

  // 4. Test REST Reset API
  const resetRes = await fetch('http://127.0.0.1:3000/api/reset-all', { method: 'POST' });
  const resetData = await resetRes.json();
  console.log('POST /api/reset-all status:', resetRes.status, 'body:', resetData);

  // 5. Test WebSocket resetAllToDefault
  const ws = new WebSocket('ws://127.0.0.1:3000/ws?session=test-room');
  ws.on('open', () => {
    console.log('WebSocket connected. Sending resetAllToDefault...');
    ws.send(JSON.stringify({ type: 'resetAllToDefault' }));
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    console.log('WebSocket received message type:', msg.type);
    if (msg.type === 'notification' || msg.type === 'state') {
      console.log('WebSocket reset verified successfully!');
      ws.close();
      process.exit(0);
    }
  });
}

testServer().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
