export interface Stat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const stats: Stat[] = [
  { label: "Total value tokenized", value: 84.2, prefix: "$", suffix: "M", decimals: 1 },
  { label: "Properties onchain", value: 8 },
  { label: "Verified investors", value: 12400, suffix: "+" },
  { label: "Avg. net rental yield", value: 4.3, suffix: "%", decimals: 1 },
];
