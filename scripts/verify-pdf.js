const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function verifyPdf() {
  console.log('--- Testing PDF Export Endpoint ---');
  const res = await fetch('http://localhost:3001/api/export?format=pdf');
  console.log('HTTP Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Disposition:', res.headers.get('content-disposition'));

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log('Byte Size:', buffer.length, 'bytes');

  const magic = buffer.subarray(0, 5).toString('ascii');
  console.log('Header Magic Bytes:', magic, '(Expected: %PDF-)');
  const hasMagic = magic === '%PDF-';

  const trailer = buffer.subarray(buffer.length - 10).toString('ascii').trim();
  console.log('Trailer Ending:', trailer, '(Expected ends with %%EOF)');
  const hasTrailer = trailer.endsWith('%%EOF');

  // Load with pdf-lib to verify structural validity
  let validDoc = false;
  let pageCount = 0;
  try {
    const doc = await PDFDocument.load(buffer);
    pageCount = doc.getPageCount();
    validDoc = true;
    console.log('PDFDocument.load succeeded! Total Pages:', pageCount);
  } catch (err) {
    console.error('Failed to parse PDF with pdf-lib:', err);
  }

  // Save sample artifact for inspection
  fs.writeFileSync('dealflow360-sample.pdf', buffer);
  console.log('Saved sample PDF to dealflow360-sample.pdf');

  console.log('\n--- PDF Verification Summary ---');
  console.log('Valid HTTP Status (200):', res.status === 200);
  console.log('Valid Content-Type (application/pdf):', res.headers.get('content-type') === 'application/pdf');
  console.log('Valid Magic Header (%PDF-):', hasMagic);
  console.log('Valid Trailer (%%EOF):', hasTrailer);
  console.log('Substantial File Size (>2KB):', buffer.length > 2000);
  console.log('pdf-lib Load Successful:', validDoc);

  const allPassed = res.status === 200 && hasMagic && hasTrailer && validDoc && buffer.length > 2000;
  console.log('\nOverall PDF Export Result:', allPassed ? 'PASS' : 'FAIL');
  process.exit(allPassed ? 0 : 1);
}

verifyPdf();
