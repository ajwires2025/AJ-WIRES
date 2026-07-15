import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { calcPayslipAmounts } from "@/lib/accounts/payroll";
import { derivePaymentStatus } from "@/lib/accounts/gst-calc";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { Employee, Payslip, PayslipInput } from "@/lib/accounts/types";

const payslipsCol = collection(db, "payslips");

export function subscribeToPayslips(onChange: (payslips: Payslip[]) => void) {
  const q = query(payslipsCol, orderBy("month", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Payslip));
  });
}

export async function createPayslip(input: PayslipInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(payslipsCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updatePayslip(id: string, input: PayslipInput) {
  await updateDoc(doc(db, "payslips", id), { ...input });
}

export async function deletePayslip(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "payslips", id));
  const data = snap.data();
  await deleteDoc(doc(db, "payslips", id));
  await logDeletion({
    collectionName: "payslips",
    recordId: id,
    summary: data ? `Payslip ${data.month} — ${data.employeeName} — ₹${data.netSalary}` : id,
    deletedBy,
    deletedByName,
  });
}

// Creates one payslip per active employee for the given month, from their
// current salary structure — skips employees who already have a payslip for
// that month so re-running doesn't duplicate. Returns how many were created.
export async function generatePayrollForMonth(employees: Employee[], month: string, createdBy: string): Promise<number> {
  const existingSnap = await getDocs(query(payslipsCol, where("month", "==", month)));
  const alreadyGenerated = new Set(existingSnap.docs.map((d) => d.data().employeeId as string));

  const activeEmployees = employees.filter((e) => e.status === "active" && !alreadyGenerated.has(e.id));

  await Promise.all(
    activeEmployees.map((employee) => {
      const amounts = calcPayslipAmounts(employee);
      const input: PayslipInput = {
        employeeId: employee.id,
        employeeName: employee.name,
        month,
        basic: employee.basic,
        hra: employee.hra,
        conveyance: employee.conveyance,
        specialAllowance: employee.specialAllowance,
        otherAllowances: 0,
        grossSalary: amounts.grossSalary,
        pfEmployee: amounts.pfEmployee,
        pfEmployer: amounts.pfEmployer,
        esiEmployee: amounts.esiEmployee,
        esiEmployer: amounts.esiEmployer,
        professionalTax: amounts.professionalTax,
        tdsSalary: 0,
        otherDeductions: 0,
        netSalary: amounts.netSalary,
        amountPaid: 0,
        paymentStatus: derivePaymentStatus(amounts.netSalary, 0),
        notes: "",
      };
      return createPayslip(input, createdBy);
    })
  );

  return activeEmployees.length;
}
