-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StoreRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE', 'BOGO', 'BUNDLE', 'FREEBIE', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "TargetScope" AS ENUM ('ALL', 'CATEGORY', 'SPECIFIC');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "SavedCouponStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "MealTokenStatus" AS ENUM ('ISSUED', 'SELECTED', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID');

-- CreateTable
CREATE TABLE "store" (
    "id" TEXT NOT NULL,
    "business_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "sub_category_id" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "address_detail" TEXT,
    "postal_code" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "operating_hours" JSONB NOT NULL DEFAULT '{}',
    "seating_capacity" INTEGER,
    "has_parking" BOOLEAN NOT NULL DEFAULT false,
    "has_delivery" BOOLEAN NOT NULL DEFAULT false,
    "delivery_platforms" TEXT[],
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "images" TEXT[],
    "status" "StoreStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "icon" TEXT,
    "parent_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_account" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "email" TEXT,
    "role" "StoreRole" NOT NULL DEFAULT 'OWNER',
    "permissions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_sales_pattern" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "hourly_pattern" JSONB,
    "daily_pattern" JSONB,
    "vulnerable_slots" JSONB,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_sales_pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" INTEGER NOT NULL,
    "cost" INTEGER,
    "margin_rate" DECIMAL(5,4),
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_sales_pattern" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "sales_share" DECIMAL(5,4),
    "order_share" DECIMAL(5,4),
    "time_popularity" JSONB,
    "seasonality" JSONB,
    "weather_correlation" JSONB,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_sales_pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" INTEGER,
    "discount_condition" JSONB,
    "target_scope" "TargetScope" NOT NULL DEFAULT 'SPECIFIC',
    "target_category" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "available_days" INTEGER[],
    "available_time_start" TEXT,
    "available_time_end" TEXT,
    "blackout_dates" TIMESTAMP(3)[],
    "total_quantity" INTEGER,
    "daily_limit" INTEGER,
    "per_user_limit" INTEGER NOT NULL DEFAULT 1,
    "distribution_channels" TEXT[],
    "status" "CouponStatus" NOT NULL DEFAULT 'DRAFT',
    "template_id" TEXT,
    "parent_coupon_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stats_issued" INTEGER NOT NULL DEFAULT 0,
    "stats_redeemed" INTEGER NOT NULL DEFAULT 0,
    "stats_redemption_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_item" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "suitable_store_types" TEXT[],
    "suitable_situations" TEXT[],
    "default_dna" JSONB NOT NULL,
    "customization_guide" JSONB,
    "total_instances" INTEGER NOT NULL DEFAULT 0,
    "avg_roi" DECIMAL(6,3),
    "success_rate" DECIMAL(5,4),
    "performance_by_industry" JSONB,
    "performance_by_region" JSONB,
    "failure_patterns" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupon_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_daily_stats" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "issued_count" INTEGER NOT NULL DEFAULT 0,
    "issued_by_channel" JSONB NOT NULL DEFAULT '{}',
    "redeemed_count" INTEGER NOT NULL DEFAULT 0,
    "redeemed_by_hour" JSONB NOT NULL DEFAULT '{}',
    "total_discount_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupon_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_performance" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "analysis_period_start" TIMESTAMP(3) NOT NULL,
    "analysis_period_end" TIMESTAMP(3) NOT NULL,
    "baseline_period_start" TIMESTAMP(3) NOT NULL,
    "baseline_period_end" TIMESTAMP(3) NOT NULL,
    "baseline_sales" INTEGER,
    "actual_sales" INTEGER,
    "sales_lift" INTEGER,
    "sales_lift_percent" DECIMAL(5,4),
    "discount_cost" INTEGER,
    "net_effect" INTEGER,
    "roi" DECIMAL(6,3),
    "spillover_other_items" DECIMAL(5,4),
    "spillover_other_slots" DECIMAL(5,4),
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "device_id" TEXT,
    "phone" TEXT,
    "auth_provider" TEXT,
    "auth_provider_id" TEXT,
    "nickname" TEXT,
    "last_latitude" DECIMAL(10,8),
    "last_longitude" DECIMAL(11,8),
    "stats_coupons_saved" INTEGER NOT NULL DEFAULT 0,
    "stats_coupons_used" INTEGER NOT NULL DEFAULT 0,
    "stats_total_saved_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3),

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_coupon" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acquired_channel" TEXT,
    "status" "SavedCouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "used_at" TIMESTAMP(3),
    "redemption_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_store" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemption" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "saved_coupon_id" TEXT,
    "customer_id" TEXT,
    "store_id" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_amount" INTEGER,
    "discount_amount" INTEGER NOT NULL,
    "final_amount" INTEGER,
    "order_items" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership" (
    "id" TEXT NOT NULL,
    "distributor_store_id" TEXT NOT NULL,
    "provider_store_id" TEXT NOT NULL,
    "status" "PartnershipStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "commission_per_redemption" INTEGER NOT NULL DEFAULT 500,
    "stats_tokens_issued" INTEGER NOT NULL DEFAULT 0,
    "stats_coupons_selected" INTEGER NOT NULL DEFAULT 0,
    "stats_redemptions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "terminated_at" TIMESTAMP(3),

    CONSTRAINT "partnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_coupon" (
    "id" TEXT NOT NULL,
    "partnership_id" TEXT NOT NULL,
    "provider_store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" INTEGER,
    "description" TEXT,
    "target_items" TEXT[],
    "redemption_window" TEXT NOT NULL DEFAULT 'next_day',
    "available_time_start" TEXT,
    "available_time_end" TEXT,
    "daily_limit" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "stats_selected" INTEGER NOT NULL DEFAULT 0,
    "stats_redeemed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cross_coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_token" (
    "id" TEXT NOT NULL,
    "token_code" TEXT NOT NULL,
    "distributor_store_id" TEXT NOT NULL,
    "partnership_id" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meal_type" TEXT,
    "day_of_week" INTEGER,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "MealTokenStatus" NOT NULL DEFAULT 'ISSUED',
    "selected_cross_coupon_id" TEXT,
    "selected_at" TIMESTAMP(3),
    "redeemed_at" TIMESTAMP(3),
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_coupon_settlement" (
    "id" TEXT NOT NULL,
    "partnership_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_redemptions" INTEGER NOT NULL,
    "commission_per_unit" INTEGER NOT NULL,
    "total_commission" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "payment_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cross_coupon_settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "center_latitude" DECIMAL(10,8) NOT NULL,
    "center_longitude" DECIMAL(11,8) NOT NULL,
    "characteristics" JSONB,
    "stats_total_stores" INTEGER NOT NULL DEFAULT 0,
    "stats_active_coupons" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_fatigue_matrix" (
    "id" TEXT NOT NULL,
    "commercial_area_id" TEXT,
    "transition_matrix" JSONB NOT NULL,
    "time_modifiers" JSONB,
    "recommended_pairings" JSONB,
    "sample_size" INTEGER,
    "last_calculated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_fatigue_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_business_number_key" ON "store"("business_number");

-- CreateIndex
CREATE UNIQUE INDEX "store_account_phone_key" ON "store_account"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "store_sales_pattern_store_id_period_type_period_start_key" ON "store_sales_pattern"("store_id", "period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "item_sales_pattern_item_id_period_start_key" ON "item_sales_pattern"("item_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_item_coupon_id_item_id_key" ON "coupon_item"("coupon_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_daily_stats_coupon_id_date_key" ON "coupon_daily_stats"("coupon_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_performance_coupon_id_analysis_period_start_key" ON "coupon_performance"("coupon_id", "analysis_period_start");

-- CreateIndex
CREATE UNIQUE INDEX "customer_device_id_key" ON "customer"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_phone_key" ON "customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "saved_coupon_redemption_id_key" ON "saved_coupon"("redemption_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_coupon_customer_id_coupon_id_key" ON "saved_coupon"("customer_id", "coupon_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_store_customer_id_store_id_key" ON "favorite_store"("customer_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "partnership_distributor_store_id_provider_store_id_key" ON "partnership"("distributor_store_id", "provider_store_id");

-- CreateIndex
CREATE UNIQUE INDEX "meal_token_token_code_key" ON "meal_token"("token_code");

-- CreateIndex
CREATE UNIQUE INDEX "cross_coupon_settlement_partnership_id_period_start_key" ON "cross_coupon_settlement"("partnership_id", "period_start");

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "store_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "store_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_category" ADD CONSTRAINT "store_category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "store_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_account" ADD CONSTRAINT "store_account_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_sales_pattern" ADD CONSTRAINT "store_sales_pattern_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_sales_pattern" ADD CONSTRAINT "item_sales_pattern_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "coupon_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_parent_coupon_id_fkey" FOREIGN KEY ("parent_coupon_id") REFERENCES "coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_item" ADD CONSTRAINT "coupon_item_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_item" ADD CONSTRAINT "coupon_item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_daily_stats" ADD CONSTRAINT "coupon_daily_stats_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_performance" ADD CONSTRAINT "coupon_performance_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_coupon" ADD CONSTRAINT "saved_coupon_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_coupon" ADD CONSTRAINT "saved_coupon_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_coupon" ADD CONSTRAINT "saved_coupon_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "redemption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_store" ADD CONSTRAINT "favorite_store_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemption" ADD CONSTRAINT "redemption_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemption" ADD CONSTRAINT "redemption_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemption" ADD CONSTRAINT "redemption_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership" ADD CONSTRAINT "partnership_distributor_store_id_fkey" FOREIGN KEY ("distributor_store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership" ADD CONSTRAINT "partnership_provider_store_id_fkey" FOREIGN KEY ("provider_store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_coupon" ADD CONSTRAINT "cross_coupon_partnership_id_fkey" FOREIGN KEY ("partnership_id") REFERENCES "partnership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_coupon" ADD CONSTRAINT "cross_coupon_provider_store_id_fkey" FOREIGN KEY ("provider_store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_token" ADD CONSTRAINT "meal_token_distributor_store_id_fkey" FOREIGN KEY ("distributor_store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_token" ADD CONSTRAINT "meal_token_partnership_id_fkey" FOREIGN KEY ("partnership_id") REFERENCES "partnership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_token" ADD CONSTRAINT "meal_token_selected_cross_coupon_id_fkey" FOREIGN KEY ("selected_cross_coupon_id") REFERENCES "cross_coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_token" ADD CONSTRAINT "meal_token_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_coupon_settlement" ADD CONSTRAINT "cross_coupon_settlement_partnership_id_fkey" FOREIGN KEY ("partnership_id") REFERENCES "partnership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_fatigue_matrix" ADD CONSTRAINT "category_fatigue_matrix_commercial_area_id_fkey" FOREIGN KEY ("commercial_area_id") REFERENCES "commercial_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
