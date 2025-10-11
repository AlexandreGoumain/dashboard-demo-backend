-- CreateTable
CREATE TABLE "instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "region" TEXT,
    "plan" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instances_slug_key" ON "instances"("slug");

-- CreateTable for implicit many-to-many relation
CREATE TABLE "_UserInstances" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndexes
CREATE UNIQUE INDEX "_UserInstances_AB_unique" ON "_UserInstances"("A", "B");
CREATE INDEX "_UserInstances_B_index" ON "_UserInstances"("B");

-- AddForeignKey
ALTER TABLE "_UserInstances"
    ADD CONSTRAINT "_UserInstances_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_UserInstances"
    ADD CONSTRAINT "_UserInstances_B_fkey" FOREIGN KEY ("B") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
