#!/bin/bash

# Test script for add-onboarding-check CLI
# This script demonstrates how to use the CLI with sample data

echo "🧪 Testing Add Onboarding Check CLI"
echo "=================================="

# Test 1: Help command
echo "📋 Test 1: Help command"
pnpm run add-onboarding-check --help
echo ""

# Test 2: Validation error (missing required fields)
echo "📋 Test 2: Validation error (missing required fields)"
pnpm run add-onboarding-check --event-type INVALID_EVENT_TYPE
echo ""

# Test 3: Valid command (this will fail if Redis is not running, but shows proper usage)
echo "📋 Test 3: Valid command (will fail if Redis not running)"
pnpm run add-onboarding-check \
  --event-type ONBOARDING_CHECK_DUPLICATE_REGISTRATION \
  --checklist-instance-id 507f1f77bcf86cd799439011 \
  --registration-id REG-12345 \
  --onboarding-processing-id 507f1f77bcf86cd799439012 \
  --section-title "Company Verification" \
  --item-title "Check for duplicate company registrations"
echo ""

echo "✅ Test script completed"
echo "Note: Some tests may fail if Redis is not running, which is expected"


