import type { Employee } from "@/lib/accounts/types";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Telangana Professional Tax slabs (monthly, salary-based) — a working
// default; verify current slabs with your CA as these are revised by the
// state government from time to time.
export function calcTelanganaProfessionalTax(grossSalary: number): number {
  if (grossSalary <= 15000) return 0;
  if (grossSalary <= 20000) return 150;
  return 200;
}

export type PayslipAmounts = {
  grossSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  netSalary: number;
};

// Computes a payslip's figures from an employee's current salary structure.
// otherAllowances/otherDeductions/tdsSalary are per-payslip overrides (bonus,
// unpaid-leave recovery, manually-computed 192B TDS) layered on top.
export function calcPayslipAmounts(
  employee: Employee,
  otherAllowances = 0,
  otherDeductions = 0,
  tdsSalary = 0
): PayslipAmounts {
  const grossSalary = round2(employee.basic + employee.hra + employee.conveyance + employee.specialAllowance + otherAllowances);

  const pfEmployee = employee.pfApplicable ? round2((employee.basic * employee.pfRatePercent) / 100) : 0;
  const pfEmployer = employee.pfApplicable ? round2((employee.basic * employee.pfRatePercent) / 100) : 0;

  const esiEmployee = employee.esiApplicable ? round2((grossSalary * employee.esiEmployeeRatePercent) / 100) : 0;
  const esiEmployer = employee.esiApplicable ? round2((grossSalary * employee.esiEmployerRatePercent) / 100) : 0;

  const professionalTax = calcTelanganaProfessionalTax(grossSalary);

  const netSalary = round2(grossSalary - pfEmployee - esiEmployee - professionalTax - tdsSalary - otherDeductions);

  return { grossSalary, pfEmployee, pfEmployer, esiEmployee, esiEmployer, professionalTax, netSalary };
}
