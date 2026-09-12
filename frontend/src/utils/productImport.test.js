import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProductSheet } from './productImport.js';

test('stock report skips headings, spacers and totals and preserves worksheet row numbers', () => {
  const result = parseProductSheet([
    [], ['AAROUN STORES'], ['Sales Summary'],
    ['Product', '', 'Category', '', 'MRP', 'Quantity', '', 'Sales Price', 'Total Amount'],
    ['Soap', '', 'Bath', '', 20, 4, '', 18.5, 74],
    [], ['', '', '', '', '', '', '', '', 74],
  ]);
  assert.equal(result.isSalesReport, true);
  assert.equal(result.rows.length, 1);
  assert.deepEqual([result.rows[0].rowNumber, result.rows[0].title, result.rows[0].category, result.rows[0].price, result.rows[0].mrp, result.rows[0].stock], [5, 'Soap', 'Bath', 18.5, 20, 4]);
  assert.equal(result.rows[0].isValid, true);
});

test('standard template retains descriptions and images and reports incomplete products', () => {
  const { rows, isSalesReport } = parseProductSheet([
    ['title', 'category', 'price', 'mrp', 'stock', 'description', 'imageUrls'],
    ['Rice', 'Food', '1,000', 1200, 0, 'A bag of rice', 'https://example.com/rice.jpg'],
    ['', 'Food', 10, 20, 1],
  ]);
  assert.equal(isSalesReport, false);
  assert.equal(rows[0].price, 1000);
  assert.equal(rows[0].description, 'A bag of rice');
  assert.deepEqual(rows[0].images, ['https://example.com/rice.jpg']);
  assert.equal(rows[0].isValid, true);
  assert.equal(rows[1].isValid, false);
  assert.ok(rows[1].issues.includes('Missing title'));
  assert.throws(() => parseProductSheet([['unrelated report']]), /column headings/);
});
