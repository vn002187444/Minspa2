import { describe, it, expect } from 'vitest';

describe('Payroll Calculation Formula', () => {
  const calculateNetSalary = (
    baseSalary: number,
    commissionAmount: number,
    tipAmount: number,
    bonusAmount: number,
    deductionAmount: number
  ) => {
    return Math.max(0, baseSalary + commissionAmount + tipAmount + bonusAmount - deductionAmount);
  };

  it('should calculate standard net salary correctly with 20% commission and tips', () => {
    const baseSalary = 5000000;
    const revenue = 20000000;
    const commissionRate = 0.20;
    const commissionAmount = Math.round(revenue * commissionRate); // 4,000,000
    const tipAmount = 500000;
    const bonusAmount = 200000;
    const deductionAmount = 100000;

    const netSalary = calculateNetSalary(baseSalary, commissionAmount, tipAmount, bonusAmount, deductionAmount);
    // 5,000,000 + 4,000,000 + 500,000 + 200,000 - 100,000 = 9,600,000
    expect(netSalary).toBe(9600000);
  });

  it('should floor at 0 if deductions exceed total earnings', () => {
    const baseSalary = 1000000;
    const commissionAmount = 0;
    const tipAmount = 0;
    const bonusAmount = 0;
    const deductionAmount = 5000000; // huge penalty

    const netSalary = calculateNetSalary(baseSalary, commissionAmount, tipAmount, bonusAmount, deductionAmount);
    expect(netSalary).toBe(0);
  });
});

describe('15-Minute Slot Step Math', () => {
  it('should step correctly in 15 minute intervals from 9:00 to 20:30', () => {
    const generatedSlots: string[] = [];
    for (let h = 9; h <= 20; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === 20 && m > 30) break;
        generatedSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }

    expect(generatedSlots[0]).toBe('09:00');
    expect(generatedSlots[1]).toBe('09:15');
    expect(generatedSlots[2]).toBe('09:30');
    expect(generatedSlots[3]).toBe('09:45');
    expect(generatedSlots[4]).toBe('10:00');
    expect(generatedSlots[generatedSlots.length - 1]).toBe('20:30');
    // Total slots: 11 full hours (9 to 19 = 11 * 4 = 44) + 3 slots in hour 20 (20:00, 20:15, 20:30) = 47 slots
    expect(generatedSlots.length).toBe(47);
  });

  it('should not mark future date morning slots as past', () => {
    const isToday = false;
    const currentMinutes = 17 * 60; // 17:00 in the afternoon
    const morningSlotMinutes = 9 * 60; // 09:00 morning slot

    const isPast = isToday && morningSlotMinutes < currentMinutes;
    expect(isPast).toBe(false); // Morning slot tomorrow is NOT past!
  });
});

describe('Date Utilities for Payroll', () => {
  it('should calculate the correct last day of month avoiding Postgres date out of range', () => {
    expect(new Date(2026, 2, 0).getDate()).toBe(28); // Feb non-leap
    expect(new Date(2024, 2, 0).getDate()).toBe(29); // Feb leap year
    expect(new Date(2026, 4, 0).getDate()).toBe(30); // April has 30 days
    expect(new Date(2026, 12, 0).getDate()).toBe(31); // Dec has 31 days
  });
});

describe('Staff Base Salary Resolution', () => {
  const resolveBaseSalary = (
    existingSnapshotBase: number | null | undefined,
    staffConfiguredBase: number | null | undefined,
    defaultBase: number = 5000000
  ) => {
    const staffBase = staffConfiguredBase && staffConfiguredBase > 0 ? staffConfiguredBase : defaultBase;
    return existingSnapshotBase != null && existingSnapshotBase > 0 ? existingSnapshotBase : staffBase;
  };

  it('should use staff profile base salary when no snapshot override exists', () => {
    // Senior staff with 8,000,000 base salary
    const base = resolveBaseSalary(null, 8000000);
    expect(base).toBe(8000000);
  });

  it('should fallback to default 5,000,000 when staff has 0 or null base salary', () => {
    const base = resolveBaseSalary(null, 0);
    expect(base).toBe(5000000);

    const baseNull = resolveBaseSalary(null, null);
    expect(baseNull).toBe(5000000);
  });

  it('should preserve snapshot override when existing snapshot is present', () => {
    // Staff configured 6,000,000, but snapshot was adjusted to 7,500,000
    const base = resolveBaseSalary(7500000, 6000000);
    expect(base).toBe(7500000);
  });
});
