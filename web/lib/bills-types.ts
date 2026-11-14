export type Bill = {
  id: string;
  name: string;
  amountUsd: number;
  dueDay: number;
  createdAt: string;
};

export type BillsFile = {
  bills: Bill[];
};