const fs = require('fs');
const docx = require('docx');
const XLSX = require('xlsx');

async function generate() {
  // Generate DOCX
  const doc = new docx.Document({
    sections: [{
      properties: {},
      children: [
        new docx.Paragraph({
          children: [new docx.TextRun("Hello Word from Node")]
        })
      ]
    }]
  });
  const docxBuffer = await docx.Packer.toBuffer(doc);
  fs.writeFileSync('test.docx', docxBuffer);

  // Generate XLSX
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["Label", "Value"], ["A", 10], ["B", 20]]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, 'test.xlsx');

  // Generate Image
  const imgData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  fs.writeFileSync('test.png', Buffer.from(imgData, 'base64'));

  console.log("Test files generated.");
}
generate().catch(console.error);
