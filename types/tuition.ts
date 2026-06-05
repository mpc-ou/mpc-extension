export type TuitionCategory = "tất cả" | "học phí" | "dịch vụ";

export type TuitionSummaryEntry = {
  semesterName: string;
  grossAmount: number;
  discount: number;
  receivable: number;
  collected: number;
  debt: number;
};

export type TuitionReceiptItem = {
  courseCode: string;
  courseName: string;
  group: string;
  credits: number;
  amount: number;
};

export type TuitionReceiptGroup = {
  receiptLabel: string;
  receiptNumber: string;
  receiptType: "A" | "B";
  createdAt: string;
  contractDate?: string;
  linkedPaymentNumber?: string;
  items: TuitionReceiptItem[];
  subtotal: number;
};

export type PairedReceiptGroup = TuitionReceiptGroup & {
  linkedReceiptNumber?: string;
  linkedReceiptDate?: string;
};

export type SemesterTuitionDetail = {
  semesterName: string;
  receiptGroups: TuitionReceiptGroup[];
  bankAccount?: string;
};

export type TuitionStorageType = {
  summary: TuitionSummaryEntry[];
  details: Record<string, SemesterTuitionDetail>;
  updatedAt: string;
};

export type TuitionStatsType = {
  totalSpent: number;
  totalDebt: number;
  semesterCount: number;
  avgPerSemester: number;
  avgPerCredit: number;
  minPerCredit: number;
  maxPerCredit: number;
  totalCredits: number;
  totalCreditsWithOther: number;
  mostExpensiveSemester: { name: string; amount: number };
  cheapestSemester: { name: string; amount: number };
};

export type ScholarshipType = "xuat_sac" | "gioi" | "kha" | "mien_hoc_phi" | null;

export type ScholarshipRecord = {
  type: ScholarshipType;
  rate: number; // 0-1
  label: string;
};

export const SCHOLARSHIP_OPTIONS: { type: NonNullable<ScholarshipType>; rate: number; label: string }[] = [
  { type: "xuat_sac", rate: 1.0, label: "Xuất sắc (100%)" },
  { type: "gioi", rate: 0.7, label: "Giỏi (70%)" },
  { type: "kha", rate: 0.5, label: "Khá (50%)" },
  { type: "mien_hoc_phi", rate: 1.0, label: "Miễn học phí (100%)" }
];
