// Jalali (Persian) Date conversion utility in pure TypeScript

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
  'مرداد', 'شهریور', 'مهر', 'آبان',
  'آذر', 'دی', 'بهمن', 'اسفند'
];

export function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/\d/g, (x) => persianDigits[parseInt(x)]);
}

export function toJalaliDate(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return '—';
  let date: Date;
  if (typeof dateInput === 'string') {
    // If format is YYYY-MM-DD
    const parts = dateInput.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const gy = parseInt(parts[0]);
      const gm = parseInt(parts[1]);
      const gd = parseInt(parts[2]);
      if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd)) {
        const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
        return toPersianDigits(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`);
      }
    }
    date = new Date(dateInput);
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    return String(dateInput);
  }

  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  return toPersianDigits(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`);
}

export function formatPersianFullDate(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return '—';
  let date: Date;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const gy = parseInt(parts[0]);
      const gm = parseInt(parts[1]);
      const gd = parseInt(parts[2]);
      if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd)) {
        const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
        const monthName = PERSIAN_MONTHS[jm - 1] || '';
        return toPersianDigits(`${jd} ${monthName} ${jy}`);
      }
    }
    date = new Date(dateInput);
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) return String(dateInput);

  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  const monthName = PERSIAN_MONTHS[jm - 1] || '';
  return toPersianDigits(`${jd} ${monthName} ${jy}`);
}
