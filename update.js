const fs = require('fs');
const path = 'src/app/admin/salary-payroll-management/salary-payroll-management.component.html';
let content = fs.readFileSync(path, 'utf8');

const map = {
  'rateOfWage': 'rateOfWageError',
  'daysWorked': 'daysWorkedError',
  'overtimeHours': 'overtimeHoursError',
  'basic': 'basicError',
  'specialBasic': 'specialBasicError',
  'da': 'daError',
  'overtimePayments': 'overtimePaymentsError',
  'hra': 'hraError',
  'othersEarn': 'othersEarnError',
  'totalEarn': 'totalEarnError',
  'pf': 'pfError',
  'esic': 'esicError',
  'society': 'societyError',
  'incomeTax': 'incomeTaxError',
  'insurance': 'insuranceError',
  'othersDed': 'othersDedError',
  'recoveries': 'recoveriesError',
  'totalDed': 'totalDedError',
  'netSalary': 'netSalaryError',
  'employerPfWelfare': 'employerPfWelfareError',
  'bankTxnId': 'bankTxnIdError',
  'paymentDate': 'paymentDateError',
  'remarks': 'remarksError'
};

for (const [prop, errProp] of Object.entries(map)) {
  const regex = new RegExp(`<td class="([^"]*)" \\(click\\)="!row.isEditing${prop} \\? editField\\(row, '${prop}'\\) : null">`, 'g');
  if (content.match(regex)) {
    content = content.replace(regex, `<td class="$1" [class.error-cell]="row.${errProp}" (click)="!row.isEditing${prop} ? editField(row, '${prop}') : null">`);
  }
}

fs.writeFileSync(path, content);
console.log('Done HTML update');
