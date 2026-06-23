export const DEFAULTS = {
  HOTLINE: process.env.NEXT_PUBLIC_HOTLINE || '0934 323 878',
  BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER || '13441413',
  BANK_ACCOUNT_OWNER: process.env.BANK_ACCOUNT_OWNER || 'HANG',
  BANK_NAME: process.env.BANK_NAME || 'Vietcombank',
  BANK_ID: process.env.BANK_ID || 'vcb',
} as const;
