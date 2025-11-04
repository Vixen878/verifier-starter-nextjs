-- CreateTable
CREATE TABLE `UserConfig` (
    `userId` VARCHAR(191) NOT NULL,
    `platformOwnerFullName` VARCHAR(191) NULL,
    `cbeAccountSuffix` VARCHAR(191) NULL,
    `abyssiniaAccountSuffix` VARCHAR(191) NULL,
    `telebirrNumber` VARCHAR(191) NULL,
    `cbeAccountNumber` VARCHAR(191) NULL,
    `abyssiniaAccountNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserConfig` ADD CONSTRAINT `UserConfig_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
