CREATE TABLE "ImageObject" (
  "key" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImageObject_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "ImageObject_size_check" CHECK ("size" > 0 AND "size" <= 1048576)
);
