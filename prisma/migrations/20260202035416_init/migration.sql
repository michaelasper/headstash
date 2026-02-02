-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Strain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "type" TEXT,
    "thcPct" REAL,
    "cbdPct" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "strainId" TEXT NOT NULL,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "Strain" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReviewTag" (
    "reviewId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("reviewId", "tagId"),
    CONSTRAINT "ReviewTag_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Strain_name_brand_key" ON "Strain"("name", "brand");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_strainId_idx" ON "Review"("strainId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "ReviewTag_tagId_idx" ON "ReviewTag"("tagId");
