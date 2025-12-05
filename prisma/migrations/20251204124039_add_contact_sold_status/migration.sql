/*
  Warnings:

  - The `discountPrice` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - Changed the type of `stockInCount` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "autoDeleteAt" TIMESTAMP(3),
ADD COLUMN     "contactedAt" TIMESTAMP(3),
ADD COLUMN     "quickSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "soldStatus" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'onsale',
DROP COLUMN "discountPrice",
ADD COLUMN     "discountPrice" DOUBLE PRECISION,
DROP COLUMN "stockInCount",
ADD COLUMN     "stockInCount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "password",
DROP COLUMN "profilePicture",
DROP COLUMN "role",
DROP COLUMN "updatedAt";
