import type { ClassSchedule, Student } from "./types";
import { isStudentBillingPaused } from "./billing";

export function formatClassTimeLabel(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(":").map(Number);
  const hours = Number.isFinite(hRaw) ? hRaw : 0;
  const minutes = Number.isFinite(mRaw) ? mRaw : 0;
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export function classBatchKey(schedule: Pick<ClassSchedule, "title" | "batchName">): string {
  return (schedule.batchName || schedule.title || "").trim();
}

export function studentMatchesClass(
  student: Student,
  schedule: Pick<ClassSchedule, "title" | "batchName">
): boolean {
  const key = classBatchKey(schedule).toLowerCase();
  if (!key) return false;
  if (student.batchName?.trim().toLowerCase() === key) return true;
  return (student.additionalSubjects ?? []).some(
    (s) => s.batchName?.trim().toLowerCase() === key
  );
}

export function studentsForClass(students: Student[], schedule: ClassSchedule): Student[] {
  return students.filter(
    (s) => studentMatchesClass(s, schedule) && !isStudentBillingPaused(s)
  );
}

export function isScheduleToday(schedule: ClassSchedule, now = new Date()): boolean {
  return schedule.daysOfWeek.includes(now.getDay());
}

export function buildClassWhatsAppMessage(
  studentName: string,
  instituteName: string,
  classTitle: string,
  startTime: string
): string {
  const when = formatClassTimeLabel(startTime);
  return (
    `Hello,\n\nThis is a reminder from *${instituteName}*.\n\n` +
    `*${studentName}* has *${classTitle}* today at *${when}*.\n` +
    `Please be ready 30 minutes before class.\n\nThank you.`
  );
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
