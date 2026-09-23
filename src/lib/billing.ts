import type { Student } from "./types";

export function getBillingType(student: Student): "monthly" | "course" {
  return student.billingType === "course" ? "course" : "monthly";
}

export function isCourseBilling(student: Student): boolean {
  return getBillingType(student) === "course";
}

export function getPackageFeeTotal(student: Student): number {
  return student.totalMonthlyFee ?? student.monthlyFee;
}

export function isStudentBillingPaused(
  student: Pick<Student, "pausedUntil">,
  now = new Date()
): boolean {
  const until = student.pausedUntil?.toDate?.();
  if (!until) return false;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(until.getFullYear(), until.getMonth(), until.getDate()).getTime();
  return b >= a;
}

export function isStudentOverdue(
  nextDueDate: Date,
  timing: "advance" | "arrear" = "arrear"
): boolean {
  const triggerDate = new Date(nextDueDate);
  triggerDate.setDate(25);
  if (timing === "advance") {
    triggerDate.setMonth(triggerDate.getMonth() - 1);
  }
  return new Date() >= triggerDate;
}

function courseBalanceDue(student: Student): number {
  const baseFee = getPackageFeeTotal(student);
  if (student.outstandingFee != null && student.outstandingFee >= 0) {
    return Math.min(student.outstandingFee, baseFee);
  }
  return baseFee;
}

export function studentOwesFees(student: Student): boolean {
  if (isCourseBilling(student)) return courseBalanceDue(student) > 0;
  return true;
}

export function isStudentFeeOverdue(
  student: Student,
  timing: "advance" | "arrear" = "arrear"
): boolean {
  if (isStudentBillingPaused(student)) return false;
  if (!studentOwesFees(student)) return false;
  return isStudentOverdue(student.nextDueDate.toDate(), timing);
}
