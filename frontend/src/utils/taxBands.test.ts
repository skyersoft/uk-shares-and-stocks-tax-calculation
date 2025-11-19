import {
  getTaxBands,
  findTaxBand,
  calculateAdjustedPersonalAllowance,
  calculateRemainingBasicRateBand
} from './taxBands';

describe('taxBands', () => {
  describe('getTaxBands', () => {
    it('returns England/Wales/NI tax bands by default', () => {
      const bands = getTaxBands('england-wales-ni');
      
      expect(bands).toHaveLength(4);
      expect(bands[0].name).toBe('Personal Allowance');
      expect(bands[0].threshold).toBe(0);
      expect(bands[0].upperLimit).toBe(12570);
      expect(bands[0].rate).toBe(0);
    });

    it('returns Scottish tax bands when specified', () => {
      const bands = getTaxBands('scotland');
      
      expect(bands).toHaveLength(6);
      expect(bands.some(band => band.name === 'Starter Rate')).toBe(true);
      expect(bands.some(band => band.name === 'Intermediate Rate')).toBe(true);
    });

    it('includes correct rates for England/Wales/NI', () => {
      const bands = getTaxBands('england-wales-ni');
      
      const basicRate = bands.find(b => b.name === 'Basic Rate');
      expect(basicRate?.rate).toBe(0.20);
      
      const higherRate = bands.find(b => b.name === 'Higher Rate');
      expect(higherRate?.rate).toBe(0.40);
      
      const additionalRate = bands.find(b => b.name === 'Additional Rate');
      expect(additionalRate?.rate).toBe(0.45);
    });

    it('includes correct rates for Scotland', () => {
      const bands = getTaxBands('scotland');
      
      const starterRate = bands.find(b => b.name === 'Starter Rate');
      expect(starterRate?.rate).toBe(0.19);
      
      const basicRate = bands.find(b => b.name === 'Basic Rate');
      expect(basicRate?.rate).toBe(0.20);
      
      const intermediateRate = bands.find(b => b.name === 'Intermediate Rate');
      expect(intermediateRate?.rate).toBe(0.21);
      
      const higherRate = bands.find(b => b.name === 'Higher Rate');
      expect(higherRate?.rate).toBe(0.42);
      
      const topRate = bands.find(b => b.name === 'Top Rate');
      expect(topRate?.rate).toBe(0.47);
    });
  });

  describe('findTaxBand', () => {
    it('returns Personal Allowance for income under £12,570', () => {
      const bands = getTaxBands('england-wales-ni');
      const band = findTaxBand(10000, bands);
      expect(band.name).toBe('Personal Allowance');
      expect(band.rate).toBe(0);
    });

    it('returns Basic Rate for income between £12,571 and £50,270', () => {
      const bands = getTaxBands('england-wales-ni');
      const band = findTaxBand(30000, bands);
      expect(band.name).toBe('Basic Rate');
      expect(band.rate).toBe(0.20);
    });

    it('returns Higher Rate for income between £50,271 and £125,140', () => {
      const bands = getTaxBands('england-wales-ni');
      const band = findTaxBand(75000, bands);
      expect(band.name).toBe('Higher Rate');
      expect(band.rate).toBe(0.40);
    });

    it('returns Additional Rate for income over £125,140', () => {
      const bands = getTaxBands('england-wales-ni');
      const band = findTaxBand(150000, bands);
      expect(band.name).toBe('Additional Rate');
      expect(band.rate).toBe(0.45);
    });

    it('correctly identifies Scottish tax bands', () => {
      const bands = getTaxBands('scotland');
      const band = findTaxBand(25000, bands);
      expect(band.name).toBe('Basic Rate');
      expect(band.rate).toBe(0.20);
    });
  });

  describe('calculateAdjustedPersonalAllowance', () => {
    it('returns full allowance for income under £100,000', () => {
      const allowance = calculateAdjustedPersonalAllowance(50000);
      expect(allowance).toBe(12570);
    });

    it('returns full allowance exactly at £100,000', () => {
      const allowance = calculateAdjustedPersonalAllowance(100000);
      expect(allowance).toBe(12570);
    });

    it('reduces allowance by £1 for every £2 over £100,000', () => {
      const allowance = calculateAdjustedPersonalAllowance(110000);
      // £10,000 over threshold = £5,000 reduction
      expect(allowance).toBe(12570 - 5000);
      expect(allowance).toBe(7570);
    });

    it('reduces allowance to zero at £125,140', () => {
      const allowance = calculateAdjustedPersonalAllowance(125140);
      expect(allowance).toBe(0);
    });

    it('keeps allowance at zero for income over £125,140', () => {
      const allowance = calculateAdjustedPersonalAllowance(150000);
      expect(allowance).toBe(0);
    });

    it('handles edge case at exact threshold', () => {
      // At £100,001, reduction = Math.floor((100001 - 100000) * 0.5) = Math.floor(0.5) = 0
      // So allowance remains at full £12,570
      const allowance = calculateAdjustedPersonalAllowance(100001);
      expect(allowance).toBe(12570);
      
      // At £100,002, reduction = Math.floor(1) = 1, so allowance = 12569
      const allowance2 = calculateAdjustedPersonalAllowance(100002);
      expect(allowance2).toBe(12569);
    });
  });

  describe('calculateRemainingBasicRateBand', () => {
    it('returns full basic rate band for income within personal allowance', () => {
      const remaining = calculateRemainingBasicRateBand(10000, 'england-wales-ni');
      // Basic rate band is £12,570 to £50,270 = £37,700
      expect(remaining).toBe(37700);
    });

    it('reduces remaining band when income exceeds personal allowance', () => {
      const remaining = calculateRemainingBasicRateBand(20000, 'england-wales-ni');
      // Income in basic rate band: £20,000 - £12,570 = £7,430
      // Remaining: £37,700 - £7,430 = £30,270
      expect(remaining).toBe(30270);
    });

    it('returns zero when income exceeds basic rate threshold', () => {
      const remaining = calculateRemainingBasicRateBand(60000, 'england-wales-ni');
      expect(remaining).toBe(0);
    });

    it('accounts for personal allowance taper', () => {
      const remaining = calculateRemainingBasicRateBand(110000, 'england-wales-ni');
      // Personal allowance reduced to £7,570
      // Income above allowance: £110,000 - £7,570 = £102,430
      // This exceeds basic rate band, so remaining should be 0
      expect(remaining).toBe(0);
    });

    it('calculates correctly for Scottish bands', () => {
      const remaining = calculateRemainingBasicRateBand(15000, 'scotland');
      expect(remaining).toBeGreaterThan(0);
    });

    it('handles exact basic rate threshold', () => {
      const remaining = calculateRemainingBasicRateBand(50270, 'england-wales-ni');
      expect(remaining).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero income', () => {
      const bands = getTaxBands('england-wales-ni');
      const band = findTaxBand(0, bands);
      expect(band.name).toBe('Personal Allowance');
      
      const allowance = calculateAdjustedPersonalAllowance(0);
      expect(allowance).toBe(12570);
      
      const remaining = calculateRemainingBasicRateBand(0, 'england-wales-ni');
      expect(remaining).toBe(37700);
    });

    it('handles very high income', () => {
      const bands = getTaxBands('england-wales-ni');
      const band = findTaxBand(1000000, bands);
      expect(band.name).toBe('Additional Rate');
      expect(band.rate).toBe(0.45);
      
      const allowance = calculateAdjustedPersonalAllowance(1000000);
      expect(allowance).toBe(0);
    });

    it('handles income at band boundaries', () => {
      const bands = getTaxBands('england-wales-ni');
      expect(findTaxBand(12570, bands).name).toBe('Personal Allowance');
      expect(findTaxBand(12571, bands).name).toBe('Basic Rate');
      expect(findTaxBand(50270, bands).name).toBe('Basic Rate');
      expect(findTaxBand(50271, bands).name).toBe('Higher Rate');
    });
  });
});
