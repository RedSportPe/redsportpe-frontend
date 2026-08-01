import {
  qrExpiry,
  isQrExpired,
  isBeforeCutoff,
  motorizadoDeliveryDate,
  shalomDispatchDate,
} from './delivery-rules';

describe('delivery-rules', () => {
  describe('QR expiry (8 hours)', () => {
    it('the QR lives exactly 8 hours', () => {
      const created = new Date('2026-07-31T10:00:00');
      expect(qrExpiry(created).getTime()).toBe(new Date('2026-07-31T18:00:00').getTime());
    });

    it('is not expired within the window', () => {
      expect(isQrExpired('2026-07-31T18:00:00', new Date('2026-07-31T17:59:00'))).toBe(false);
    });

    it('expires after the window', () => {
      expect(isQrExpired('2026-07-31T18:00:00', new Date('2026-07-31T18:00:01'))).toBe(true);
    });
  });

  describe('3pm cutoff', () => {
    it('2:59 pm is before the cutoff', () => {
      expect(isBeforeCutoff(new Date('2026-07-31T14:59:00'))).toBe(true);
    });

    it('3:00 pm is already past the cutoff', () => {
      expect(isBeforeCutoff(new Date('2026-07-31T15:00:00'))).toBe(false);
    });
  });

  describe('motorizado delivery date', () => {
    it('paid before 3pm → delivered tomorrow', () => {
      const date = motorizadoDeliveryDate(new Date('2026-07-31T10:00:00'));
      expect(date.getDate()).toBe(1);   // Aug 1st
      expect(date.getMonth()).toBe(7);
    });

    it('paid after 3pm → delivered the day after tomorrow', () => {
      const date = motorizadoDeliveryDate(new Date('2026-07-31T16:00:00'));
      expect(date.getDate()).toBe(2);   // Aug 2nd
      expect(date.getMonth()).toBe(7);
    });
  });

  describe('shalom dispatch date', () => {
    it('paid before 3pm → dropped at the agency the same day', () => {
      const date = shalomDispatchDate(new Date('2026-07-31T10:00:00'));
      expect(date.getDate()).toBe(31);
    });

    it('paid after 3pm → dropped tomorrow', () => {
      const date = shalomDispatchDate(new Date('2026-07-31T16:00:00'));
      expect(date.getDate()).toBe(1);
    });
  });
});
