import { Injectable } from '@nestjs/common';
import { Address } from '@prisma/client';

@Injectable()
export class TaxService {
  calculateTaxAmount(subtotal: number, address: Address | null): number {
    if (!address) return 0;

    let taxRate = 0;

    if (address.country === 'US' || address.country === 'USA') {
      const stateTaxRates: Record<string, number> = {
        CA: 0.0825,
        NY: 0.08875,
        TX: 0.0825,
        FL: 0.0625,
        IL: 0.0625,
      };

      taxRate = stateTaxRates[address.state?.toUpperCase()] || 0.05;
    } else if (address.country === 'CA') {
      taxRate = 0.13;
    } else if (address.country === 'GB' || address.country === 'UK') {
      taxRate = 0.2;
    } else {
      taxRate = 0.1;
    }

    return parseFloat((subtotal * taxRate).toFixed(2));
  }
}
