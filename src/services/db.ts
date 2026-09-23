import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../lib/firebase";
import type {
  ClassSchedule,
  CustomBatch,
  Institute,
  PaymentMethod,
  Student,
  StudentFormData,
} from "../lib/types";
import { computePayment, getOutstandingFee } from "../lib/payments";
import { isCourseBilling } from "../lib/billing";

const studentsRef = collection(db, "students");
const paymentsRef = collection(db, "payments_ledger");
const scheduleRef = collection(db, "classes_schedule");

export async function getOrCreateInstitute(user: User): Promise<Institute> {
  const docRef = doc(db, "institutes", user.uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    const lastActive = data.lastActiveAt?.toDate?.() as Date | undefined;
    const now = new Date();
    if (!lastActive || now.getTime() - lastActive.getTime() > 3600000) {
      await updateDoc(docRef, { lastActiveAt: Timestamp.now() });
    }
    return { id: snap.id, ...data } as Institute;
  }

  const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const created = {
    name: user.displayName || "My Institute",
    email: user.email || "",
    subscriptionStatus: "trial" as const,
    trialEndsAt: Timestamp.fromDate(trialEnd),
    validTill: null,
    createdAt: Timestamp.now(),
    onboardingStep: 0,
  };
  await setDoc(docRef, created);
  return { id: user.uid, ...created };
}

export function onInstituteSnapshot(
  instituteId: string,
  callback: (institute: Institute) => void
): () => void {
  return onSnapshot(doc(db, "institutes", instituteId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() } as Institute);
  });
}

export function onStudentsSnapshot(
  instituteId: string,
  callback: (students: Student[]) => void
): () => void {
  const q = query(studentsRef, where("instituteId", "==", instituteId));
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
    students.sort(
      (a, b) => a.nextDueDate.toDate().getTime() - b.nextDueDate.toDate().getTime()
    );
    callback(students);
  });
}

async function recordMilestone(
  instituteId: string,
  field: "firstStudentAddedAt" | "firstPaymentMarkedAt" | "firstReminderSentAt"
) {
  try {
    const ref = doc(db, "institutes", instituteId);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data()?.[field]) return;
    await updateDoc(ref, { [field]: Timestamp.now() });
  } catch {
    // analytics only
  }
}

export async function addStudent(instituteId: string, data: StudentFormData): Promise<string> {
  const docRef = await addDoc(studentsRef, {
    instituteId,
    name: data.name.trim(),
    parentPhone: data.parentPhone.replace(/\D/g, ""),
    studentType: data.studentType,
    className: data.className.trim() || "N/A",
    batchName: data.batchName.trim() || "N/A",
    monthlyFee: data.monthlyFee,
    additionalSubjects: [],
    totalMonthlyFee: data.monthlyFee,
    outstandingFee: data.monthlyFee,
    hasConcession: false,
    privateNotes: "",
    nextDueDate: Timestamp.fromDate(data.nextDueDate),
    createdAt: Timestamp.now(),
  });
  await recordMilestone(instituteId, "firstStudentAddedAt");
  return docRef.id;
}

export async function markAsPaid(
  student: Student,
  paymentMethod: PaymentMethod = "cash",
  amountPaid?: number
) {
  const outstanding = getOutstandingFee(student);
  const paid = amountPaid ?? outstanding;
  const result = computePayment(student, paid);
  const paymentDate = new Date();
  paymentDate.setHours(12, 0, 0, 0);

  const batch = writeBatch(db);
  batch.set(doc(paymentsRef), {
    studentId: student.id,
    instituteId: student.instituteId,
    amountPaid: result.amountPaid,
    date: Timestamp.fromDate(paymentDate),
    monthFor: result.monthFor,
    paymentMethod,
  });

  const studentUpdate: Record<string, unknown> = {
    nextDueDate: Timestamp.fromDate(result.nextDueDate),
  };
  if (result.advanceDueDate) {
    studentUpdate.outstandingFee = isCourseBilling(student) ? 0 : deleteField();
  } else {
    studentUpdate.outstandingFee = result.remainingBalance;
  }
  batch.update(doc(db, "students", student.id), studentUpdate);
  await batch.commit();
  await recordMilestone(student.instituteId, "firstPaymentMarkedAt");
  return result;
}

export async function addCustomBatch(instituteId: string, batch: CustomBatch): Promise<void> {
  await updateDoc(doc(db, "institutes", instituteId), {
    customBatches: arrayUnion(batch),
  });
}

export async function fetchSchedules(instituteId: string): Promise<ClassSchedule[]> {
  const q = query(scheduleRef, where("instituteId", "==", instituteId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClassSchedule[];
}

export async function addSchedule(
  instituteId: string,
  data: Omit<ClassSchedule, "id" | "instituteId">
): Promise<string> {
  const ref = await addDoc(scheduleRef, {
    instituteId,
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  await deleteDoc(doc(db, "classes_schedule", scheduleId));
}

export async function recordReminderSent(instituteId: string): Promise<void> {
  await recordMilestone(instituteId, "firstReminderSentAt");
}
