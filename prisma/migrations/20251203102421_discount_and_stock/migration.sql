/*
  Warnings:

  - Added the required column `discountPrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockInCount` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPrice" TEXT NOT NULL,
ADD COLUMN     "stockInCount" TEXT NOT NULL;
