const xlsx = require('xlsx');

const filePath = 'C:/Users/soheb/Downloads/timtracking 1/timtracking/reqexcel/IT_Team_Time_Tracker (1).xlsx';
const workbook = xlsx.readFile(filePath);

console.log('Sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log('\n---', sheetName, '---');
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  // Print first 20 rows
  console.log(data.slice(0, 20).map(row => row.join('\t')).join('\n'));
});
