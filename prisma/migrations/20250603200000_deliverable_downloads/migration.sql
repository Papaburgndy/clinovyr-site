-- CreateTable
CREATE TABLE "DeliverableDownload" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliverableType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliverableDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliverableDownload_orderId_idx" ON "DeliverableDownload"("orderId");

-- CreateIndex
CREATE INDEX "DeliverableDownload_userId_idx" ON "DeliverableDownload"("userId");

-- AddForeignKey
ALTER TABLE "DeliverableDownload" ADD CONSTRAINT "DeliverableDownload_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
