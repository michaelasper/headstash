-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" TEXT NOT NULL,
    "notes" TEXT,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "strainId" TEXT NOT NULL,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "Strain" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("consumedAt", "createdAt", "id", "notes", "rating", "strainId", "updatedAt", "userId") SELECT "consumedAt", "createdAt", "id", "notes", "rating", "strainId", "updatedAt", "userId" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "Review_strainId_idx" ON "Review"("strainId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
