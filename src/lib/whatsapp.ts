import { Linking } from "react-native";
import type { Student } from "./types";
import { getOutstandingFee } from "./payments";
import { isCourseBilling } from "./billing";

export function feeReminderUrl(student: Student, instituteName: string): string {
  const dueAmount = getOutstandingFee(student);
  const packageTotal = student.totalMonthlyFee ?? student.monthlyFee;
  const isCourse = isCourseBilling(student);
  const feeLine = isCourse
    ? `The *course fee balance* of *₹${dueAmount.toLocaleString("en-IN")}* (of ₹${packageTotal.toLocaleString("en-IN")} total) for *${student.name}* is due.`
    : `The monthly fee of *₹${dueAmount.toLocaleString("en-IN")}* for *${student.name}* is due.`;
  const message = `Hello,\n\nThis is a reminder from *${instituteName}*.\n\n${feeLine}\n\nPlease pay at your earliest convenience.\n\nThank you.`;
  const phone = student.parentPhone.replace(/\D/g, "");
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

export function classWhatsAppUrl(parentPhone: string, message: string): string {
  const phone = parentPhone.replace(/\D/g, "");
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

export async function openWhatsApp(url: string): Promise<void> {
  await Linking.openURL(url);
}
