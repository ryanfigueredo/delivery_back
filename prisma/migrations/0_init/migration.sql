-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('pending', 'printed', 'finished', 'out_for_delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "whatsapp_phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_number" INTEGER,
    "daily_sequence" INTEGER,
    "display_id" TEXT,
    "customer_total_orders" INTEGER,
    "order_type" TEXT,
    "estimated_time" INTEGER,
    "delivery_address" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex (only if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_api_key_key" ON "tenants"("api_key");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "orders_tenant_id_idx" ON "orders"("tenant_id");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "orders_tenant_id_created_at_idx" ON "orders"("tenant_id", "created_at");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex (only if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenant_id_username_key" ON "users"("tenant_id", "username");

-- AddForeignKey (only if not exists)
DO $$ BEGIN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (only if not exists)
DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

