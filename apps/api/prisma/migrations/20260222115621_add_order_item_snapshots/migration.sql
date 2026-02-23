/*
  Warnings:

  - Added the required column `productTitle` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "productTitle" TEXT NOT NULL,
ADD COLUMN     "sku" TEXT;
