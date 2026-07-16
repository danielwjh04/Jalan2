import { describe, expect, it } from 'vitest';
import { findKtmbRoute, stationFor } from '../src/adapters/transit/ktmb';

describe('KTMB official ticket handoff', () => {
  it('maps common destination names to real rail stations', () => {
    expect(stationFor('Kuala Lumpur')).toBe('KL Sentral');
    expect(stationFor('Ipoh, Perak')).toBe('Ipoh');
    expect(stationFor('George Town, Penang')).toBe('Butterworth');
  });

  it('offers KITS only when both journey boundaries are rail-served', () => {
    expect(findKtmbRoute('Kuala Lumpur', 'Ipoh')).toEqual({
      url: 'https://online.ktmb.com.my/TimeTable/Search',
      originStation: 'KL Sentral',
      destinationStation: 'Ipoh',
    });
    expect(findKtmbRoute('Kuala Lumpur', 'Tioman')).toBeNull();
    expect(findKtmbRoute('Kuching', 'Kota Kinabalu')).toBeNull();
  });
});
