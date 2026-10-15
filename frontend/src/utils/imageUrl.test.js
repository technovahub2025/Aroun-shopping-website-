import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveImageUrl } from './imageUrl.js';

const api = 'https://aroun-shopping-website-fekt.onrender.com';
test('migrates saved Drive image URLs while preserving signatures', () => {
  assert.equal(
    resolveImageUrl('https://arounstorebackend-fdpa.onrender.com/api/drive-images/file_123?signature=abc&v=2', api),
    `${api}/api/drive-images/file_123?signature=abc&v=2`,
  );
});

test('leaves external images, previews, placeholders and unrelated routes unchanged', () => {
  for (const value of [
    'https://res.cloudinary.com/demo/image/upload/photo.jpg',
    'https://other.onrender.com/api/drive-images/file?signature=abc',
    'https://arounstorebackend-fdpa.onrender.com/unrelated',
    `${api}/api/drive-images/file?signature=abc`,
    '/placeholder.png', 'blob:https://www.arounstores.com/123',
    'data:image/png;base64,abc', undefined, '',
  ]) assert.equal(resolveImageUrl(value, api), value);
});

test('missing or invalid API configuration leaves saved URLs intact', () => {
  const value = 'https://arounstorebackend-fdpa.onrender.com/api/drive-images/file';
  for (const base of ['', 'invalid', 'javascript:alert(1)']) {
    assert.equal(resolveImageUrl(value, base), value);
  }
});
