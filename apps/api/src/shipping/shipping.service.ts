import { Injectable } from '@nestjs/common';
import { Address } from '@prisma/client';

@Injectable()
export class ShippingService {
  calculateShippingRate(
    cartItems: { quantity?: number }[],
    address: Address | null,
    subtotal: number,
  ): number {
    if (!address) return 0;

    if (subtotal > 200) return 0;

    let baseRate = 10;

    if (address.country === 'US' || address.country === 'USA') {
      if (['AK', 'HI'].includes(address.state)) {
        baseRate += 15;
      }
    } else {
      baseRate += 25;
    }

    const totalItems = cartItems.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );
    if (totalItems > 5) {
      baseRate += (totalItems - 5) * 2;
    }

    return baseRate;
  }
}
