import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from './config.js';

test('direct egress disables the proxy without changing the default', () => {
  const previous = { ...process.env };
  try {
    delete process.env.PROXY_URL;
    delete process.env.WARP_PROXY_URL;
    assert.equal(loadConfig().proxyURL, 'socks5://warp:1080');
    process.env.PROXY_URL = 'direct';
    assert.equal(loadConfig().proxyURL, '');
    process.env.PROXY_URL = 'socks5://another-proxy:1080';
    assert.equal(loadConfig().proxyURL, process.env.PROXY_URL);
  } finally {
    process.env = previous;
  }
});
