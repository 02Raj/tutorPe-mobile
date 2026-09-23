import type { Timestamp } from "firebase/firestore";

export type PaymentMethod = "cash" | "upi" | "bank" | "other";

export type CustomBatch = {
  id: string;
  name: string;
  className: string;
  fee: number;
};

export type Institute = {
  id: string;
  name: string;
  email: string;
  tuitionName?: string;
  teacherName?: string;
  contactNumber?: string;
  feeCollectionTiming?: "advance" | "arrear";
  subscriptionStatus?: "trial" | "pro";
  trialEndsAt?: Timestamp;
  validTill?: Timestamp | null;
  customBatches?: CustomBatch[];
  lastActiveAt?: Timestamp;
};

export type Student = {
  id: string;
  instituteId: string;
  name: string;
  parentPhone: string;
  studentType: "batch" | "home";
  billingType?: "monthly" | "course";
  className?: string;
  batchName: string;
  monthlyFee: number;
  totalMonthlyFee?: number;
  outstandingFee?: number;
  additionalSubjects?: { subjectName: string; batchName: string; fee: number }[];
  nextDueDate: Timestamp;
  pausedUntil?: Timestamp;
};

export type ClassSchedule = {
  id: string;
  instituteId: string;
  title: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  color: string;
  batchName?: string;
};

export type StudentFormData = {
  name: string;
  parentPhone: string;
  studentType: "batch" | "home";
  className: string;
  batchName: string;
  monthlyFee: number;
  nextDueDate: Date;
};
