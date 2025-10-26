export type DonationSummaryResponse = {
  kpis: {
    todayTotal: number;
    weekTotal: number;
    monthTotal: number;
  };
  byFund: Array<{
    fund: string;
    count: number;
    amountCents: number;
  }>;
};
