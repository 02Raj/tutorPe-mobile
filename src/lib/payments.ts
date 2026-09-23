import type { Student } from "./types";
import { getPackageFeeTotal, isCourseBilling } from "./billing";

export type PaymentComputation = {
  amountPaid: number;
  remainingBalance: number;
  advanceDueDate: boolean;
  nextDueDate: Date;
  monthFor: string;
};

export function getOutstandingFee(student: Student): number {
  const baseFee = getPackageFeeTotal(student);
  if (isCourseBilling(student)) {
    if (student.outstandingFee != null && student.outstandingFee >= 0) {
      return Math.min(student.outstandingFee, baseFee);
    }
    return baseFee;
  }
  if (
    student.outstandingFee != null &&
    student.outstandingFee > 0 &&
    student.outstandingFee <= baseFee
  ) {
    return student.outstandingFee;
  }
  return baseFee;
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function validatePaymentAmount(amount: number, outstanding: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than zero.";
  if (amount > outstanding) {
    return `Amount cannot exceed ${formatInr(outstanding)} due.`;
  }
  return null;
}

export function computePayment(student: Student, amountPaid: number): PaymentComputation {
  const outstanding = getOutstandingFee(student);
  const error = validatePaymentAmount(amountPaid, outstanding);
  if (error) throw new Error(error);

  const currentDue = student.nextDueDate.toDate();
  const remainingBalance = outstanding - amountPaid;
  const advanceDueDate = remainingBalance <= 0;
  const nextDueDate = new Date(currentDue);
  if (!isCourseBilling(student) && advanceDueDate) {
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  }

  const monthFor = isCourseBilling(student)
    ? `Course fee — ${currentDue.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
    : currentDue.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return {
    amountPaid,
    remainingBalance: Math.max(0, remainingBalance),
    advanceDueDate,
    nextDueDate,
    monthFor,
  };
}
