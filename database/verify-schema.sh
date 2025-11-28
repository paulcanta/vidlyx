#!/bin/bash

# Vidlyx Database Verification Script
# This script verifies that the database schema is properly set up

echo "=========================================="
echo "Vidlyx Database Verification"
echo "=========================================="
echo ""

# Database connection details
export PGPASSWORD=timecloq_secure_password_2024
DB_USER=timecloq_admin
DB_NAME=vidlyx_dev
CONTAINER=timecloq-postgres-core

echo "Checking database connection..."
if docker exec -e PGPASSWORD="$PGPASSWORD" "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Database connection successful"
else
    echo "✗ Failed to connect to database"
    exit 1
fi
echo ""

echo "Verifying extensions..."
docker exec -e PGPASSWORD="$PGPASSWORD" "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "\dx" | grep -E "(uuid-ossp|pg_trgm)"
echo ""

echo "Counting database objects..."
docker exec -e PGPASSWORD="$PGPASSWORD" "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 'Tables: ' || COUNT(*)::text FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'Indexes: ' || COUNT(*)::text FROM pg_indexes WHERE schemaname = 'public'
UNION ALL
SELECT 'Triggers: ' || COUNT(*)::text FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT tgisinternal;
"
echo ""

echo "Listing all tables..."
docker exec -e PGPASSWORD="$PGPASSWORD" "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"
echo ""

echo "Verifying foreign key relationships..."
docker exec -e PGPASSWORD="$PGPASSWORD" "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) || ' foreign key constraints' as constraints
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';
"
echo ""

echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
