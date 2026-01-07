#!/bin/bash

# CI Workflow Test Script using act
# Usage: ./scripts/test-ci.sh [command]
#
# Commands:
#   list          - List all available jobs
#   dry-run       - Show what would run without executing
#   build         - Test the build job only
#   test-node     - Test the test-node job
#   test-deno     - Test the test-deno job
#   test-bun      - Test the test-bun job
#   artifacts     - Test build + artifact consumers (test-deno, test-bun)
#   full          - Test the complete workflow (all jobs)
#   all-checks    - Run all checks (lint, typecheck, build, test-node, test-deno, test-bun)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Container architecture (for Apple M-series)
ARCH="--container-architecture linux/amd64"

# Function to print colored output
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo -e "${RED}Error: 'act' is not installed${NC}"
    echo "Install it with: brew install act"
    exit 1
fi

# Get command from argument, default to 'help'
COMMAND=${1:-help}

case $COMMAND in
  list)
    print_header "Available CI Jobs"
    act -l
    ;;

  dry-run)
    print_header "Dry Run - Showing Job Execution Order"
    print_info "This shows what would run without executing"
    act -n ${ARCH}
    print_success "Dry run complete"
    ;;

  build)
    print_header "Testing Build Job"
    print_info "This will build packages and upload artifacts"
    act -j build ${ARCH} -v
    print_success "Build job completed"
    echo ""
    print_info "Check for 'Upload build artifacts' step in the output"
    ;;

  test-node)
    print_header "Testing test-node Job"
    print_info "This runs tests on Node.js versions 20, 22, 24"
    act -j test-node ${ARCH}
    print_success "test-node job completed"
    ;;

  test-deno)
    print_header "Testing test-deno Job"
    print_info "⚠️  Note: This requires build artifacts to be available"
    print_info "In real CI, build job runs first and uploads artifacts"
    print_info "With act, artifacts may not persist between runs"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      act -j test-deno ${ARCH}
      print_success "test-deno job completed"
    else
      print_info "Skipped"
    fi
    ;;

  test-bun)
    print_header "Testing test-bun Job"
    print_info "⚠️  Note: This requires build artifacts to be available"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      act -j test-bun ${ARCH}
      print_success "test-bun job completed"
    else
      print_info "Skipped"
    fi
    ;;

  artifacts)
    print_header "Testing Artifact Flow"
    print_info "This tests: build → test-deno + test-bun"
    echo ""
    print_info "Step 1: Running build job (uploads artifacts)..."
    act -j build ${ARCH} || {
      echo -e "${RED}Build job failed${NC}"
      exit 1
    }
    print_success "Build job completed"
    echo ""
    print_info "Step 2: Running test-deno (downloads artifacts)..."
    act -j test-deno ${ARCH} || {
      echo -e "${RED}test-deno job failed${NC}"
      exit 1
    }
    print_success "test-deno job completed"
    echo ""
    print_info "Step 3: Running test-bun (downloads artifacts)..."
    act -j test-bun ${ARCH} || {
      echo -e "${RED}test-bun job failed${NC}"
      exit 1
    }
    print_success "test-bun job completed"
    echo ""
    print_success "Artifact flow test completed successfully!"
    ;;

  all-checks)
    print_header "Running All Checks"
    print_info "This will run: lint, typecheck, build, test-node"
    echo ""
    print_info "Running lint..."
    act -j lint ${ARCH} || {
      echo -e "${RED}Lint failed${NC}"
      exit 1
    }
    print_success "Lint passed"
    echo ""
    print_info "Running typecheck..."
    act -j typecheck ${ARCH} || {
      echo -e "${RED}Typecheck failed${NC}"
      exit 1
    }
    print_success "Typecheck passed"
    echo ""
    print_info "Running build..."
    act -j build ${ARCH} || {
      echo -e "${RED}Build failed${NC}"
      exit 1
    }
    print_success "Build passed"
    echo ""
    print_info "Running test-node..."
    act -j test-node ${ARCH} || {
      echo -e "${RED}test-node failed${NC}"
      exit 1
    }
    print_success "test-node passed"
    echo ""
    print_success "All checks passed!"
    ;;

  full)
    print_header "Testing Complete Workflow"
    print_info "This will run all jobs in sequence"
    echo ""
    print_info "⚠️  Warning: This may take 10+ minutes"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      act ${ARCH}
      print_success "Full workflow completed"
    else
      print_info "Skipped"
    fi
    ;;

  help|*)
    echo "CI Workflow Test Script"
    echo ""
    echo "Usage: ./scripts/test-ci.sh [command]"
    echo ""
    echo "Commands:"
    echo "  list          - List all available jobs"
    echo "  dry-run       - Show job execution order without running"
    echo "  build         - Test the build job only (fastest)"
    echo "  test-node     - Test the test-node job"
    echo "  test-deno     - Test the test-deno job"
    echo "  test-bun      - Test the test-bun job"
    echo "  artifacts     - Test artifact flow (build → test-deno/test-bun)"
    echo "  all-checks    - Run lint, typecheck, build, test-node"
    echo "  full          - Test complete workflow (slow!)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/test-ci.sh list"
    echo "  ./scripts/test-ci.sh build"
    echo "  ./scripts/test-ci.sh artifacts"
    echo ""
    ;;
esac
