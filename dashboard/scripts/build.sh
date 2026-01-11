#!/bin/bash
set -e

# Production build script for Airflow UI Dashboard
echo "🚀 Starting production build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_ENV=${NODE_ENV:-production}
BUILD_VERSION=${BUILD_VERSION:-$(git describe --tags --always 2>/dev/null || echo "1.0.0")}
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

echo -e "${BLUE}Build Configuration:${NC}"
echo "  Environment: $NODE_ENV"
echo "  Version: $BUILD_VERSION"
echo "  Date: $BUILD_DATE"
echo "  Commit: ${GIT_COMMIT:0:8}"
echo ""

# Step 1: Environment validation
echo -e "${YELLOW}Step 1: Validating environment...${NC}"
if ! node scripts/validate-env.js; then
    echo -e "${RED}❌ Environment validation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Environment validation passed${NC}"
echo ""

# Step 2: Clean previous builds
echo -e "${YELLOW}Step 2: Cleaning previous builds...${NC}"
rm -rf dist/
rm -rf node_modules/.vite/
echo -e "${GREEN}✅ Clean completed${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}Step 3: Installing dependencies...${NC}"
npm ci --only=production --no-audit --no-fund
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Type checking
echo -e "${YELLOW}Step 4: Running type checks...${NC}"
if ! npm run type-check; then
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Type checking passed${NC}"
echo ""

# Step 5: Linting
echo -e "${YELLOW}Step 5: Running linter...${NC}"
if ! npm run lint; then
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Linting passed${NC}"
echo ""

# Step 6: Generate build info
echo -e "${YELLOW}Step 6: Generating build information...${NC}"
export VITE_APP_VERSION="$BUILD_VERSION"
export VITE_BUILD_DATE="$BUILD_DATE"
export VITE_GIT_COMMIT="$GIT_COMMIT"
node scripts/build-info.js
echo -e "${GREEN}✅ Build information generated${NC}"
echo ""

# Step 7: Build application
echo -e "${YELLOW}Step 7: Building application...${NC}"
if ! npm run build:${NODE_ENV}; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Step 8: Build analysis
echo -e "${YELLOW}Step 8: Analyzing build...${NC}"
BUILD_SIZE=$(du -sh dist/ | cut -f1)
JS_FILES=$(find dist/assets -name "*.js" | wc -l)
CSS_FILES=$(find dist/assets -name "*.css" | wc -l)
ASSET_FILES=$(find dist/assets -type f | wc -l)

echo "  Total size: $BUILD_SIZE"
echo "  JavaScript files: $JS_FILES"
echo "  CSS files: $CSS_FILES"
echo "  Total assets: $ASSET_FILES"
echo ""

# Step 9: Security checks
echo -e "${YELLOW}Step 9: Running security checks...${NC}"
if command -v npm audit &> /dev/null; then
    npm audit --audit-level=high --production
fi
echo -e "${GREEN}✅ Security checks completed${NC}"
echo ""

# Step 10: Create deployment package
echo -e "${YELLOW}Step 10: Creating deployment package...${NC}"
PACKAGE_NAME="airflow-dashboard-${BUILD_VERSION}.tar.gz"
tar -czf "$PACKAGE_NAME" -C dist .
PACKAGE_SIZE=$(du -sh "$PACKAGE_NAME" | cut -f1)
echo "  Package: $PACKAGE_NAME ($PACKAGE_SIZE)"
echo -e "${GREEN}✅ Deployment package created${NC}"
echo ""

# Summary
echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo -e "${BLUE}Summary:${NC}"
echo "  Version: $BUILD_VERSION"
echo "  Environment: $NODE_ENV"
echo "  Build size: $BUILD_SIZE"
echo "  Package: $PACKAGE_NAME ($PACKAGE_SIZE)"
echo "  Build time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test the build: npm run preview"
echo "  2. Build Docker image: docker build -t airflow-dashboard:$BUILD_VERSION ."
echo "  3. Deploy the package: $PACKAGE_NAME"