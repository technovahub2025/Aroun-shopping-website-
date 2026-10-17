import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveImageUrl } from './imageUrl.js';

const api = 'https://aroun-shopping-website-5nnj.onrender.com';
test('migrates saved Drive image URLs while preserving signatures', () => {
  assert.equal(
    resolveImageUrl('https://arounstorebackend-fdpa.onrender.com/api/drive-images/file_123?signature=abc&v=2', api),
    `${api}/api/drive-images/file_123?signature=abc&v=2`,
  );
});

test('migrates previous Render hosts while preserving the image ID and signature', () => {
  const path = '/api/drive-images/1ZZFp1EjpWRpYHw1rijXoq-GLEtNH6cCk?signature=fa4b320d67bb4f3d25941173502ceb79c9e443736024b3b4ace2be3c0bc57eb2';
  for (const host of ['ysi0', 'fekt']) {
    assert.equal(
      resolveImageUrl(`https://aroun-shopping-website-${host}.onrender.com${path}`, api),
      `${api}${path}`,
    );
  }
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
