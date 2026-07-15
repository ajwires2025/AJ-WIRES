import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { Employee, EmployeeInput } from "@/lib/accounts/types";

const employeesCol = collection(db, "employees");

export function subscribeToEmployees(onChange: (employees: Employee[]) => void) {
  const q = query(employeesCol, orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Employee));
  });
}

export async function createEmployee(input: EmployeeInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(employeesCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateEmployee(id: string, input: EmployeeInput) {
  await updateDoc(doc(db, "employees", id), { ...input });
}

export async function deleteEmployee(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "employees", id));
  const data = snap.data();
  await deleteDoc(doc(db, "employees", id));
  await logDeletion({
    collectionName: "employees",
    recordId: id,
    summary: data ? `${data.name} (${data.employeeCode || "no code"})` : id,
    deletedBy,
    deletedByName,
  });
}
