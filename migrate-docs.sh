#!/bin/bash

# Deeldesk.ai Documentation Migration Script
# This script reorganizes documentation files into a structured directory layout
# Run from project root: ./migrate-docs.sh

set -e  # Exit on error

echo "🚀 Starting Deeldesk.ai documentation migration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the project root
if [ ! -f "README.md" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p docs/planning
mkdir -p docs/architecture
mkdir -p docs/product
mkdir -p docs/design
mkdir -p docs/wireframes
mkdir -p database
print_success "Directory structure created"

# Move planning documents
echo ""
echo "📋 Moving planning documents..."
if [ -f "IMPLEMENTATION_PLAN.md" ]; then
    mv IMPLEMENTATION_PLAN.md docs/planning/
    print_success "Moved IMPLEMENTATION_PLAN.md"
fi

if [ -f "Deeldesk_Sprint_Plan_Phase0_MVP.md" ]; then
    mv Deeldesk_Sprint_Plan_Phase0_MVP.md docs/planning/SPRINT_PLAN.md
    print_success "Moved and renamed Deeldesk_Sprint_Plan_Phase0_MVP.md → docs/planning/SPRINT_PLAN.md"
fi

if [ -f "CHANGES_SUMMARY.md" ]; then
    mv CHANGES_SUMMARY.md docs/planning/
    print_success "Moved CHANGES_SUMMARY.md"
fi

# Move architecture documents
echo ""
echo "🏗️  Moving architecture documents..."
if [ -f "DATABASE_SCHEMA.sql" ]; then
    mv DATABASE_SCHEMA.sql docs/architecture/
    print_success "Moved DATABASE_SCHEMA.sql"
fi

if [ -f "LLM_PROVIDER_ARCHITECTURE.md" ]; then
    mv LLM_PROVIDER_ARCHITECTURE.md docs/architecture/
    print_success "Moved LLM_PROVIDER_ARCHITECTURE.md"
fi

if [ -f "PROPOSAL_VERSIONING_MVP.md" ]; then
    mv PROPOSAL_VERSIONING_MVP.md docs/architecture/
    print_success "Moved PROPOSAL_VERSIONING_MVP.md"
fi

if [ -f "PRD_ADDENDUM_LLM_Data_Privacy.md" ]; then
    mv PRD_ADDENDUM_LLM_Data_Privacy.md docs/architecture/
    print_success "Moved PRD_ADDENDUM_LLM_Data_Privacy.md"
fi

# Move product documents
echo ""
echo "📦 Moving product documents..."
if [ -d "Docs" ]; then
    if [ -f "Docs/Deeldesk_PRD_v4_0.docx" ]; then
        mv Docs/Deeldesk_PRD_v4_0.docx docs/product/
        print_success "Moved Deeldesk_PRD_v4_0.docx"
    fi
    if [ -f "Docs/Deeldesk_MRD_v4.docx" ]; then
        mv Docs/Deeldesk_MRD_v4.docx docs/product/
        print_success "Moved Deeldesk_MRD_v4.docx"
    fi
    # Remove empty Docs directory
    if [ -z "$(ls -A Docs 2>/dev/null)" ]; then
        rmdir Docs
        print_success "Removed empty Docs directory"
    else
        print_warning "Docs directory not empty, leaving it"
    fi
fi

# Move design documents
echo ""
echo "🎨 Moving design documents..."
if [ -d "Wireframes" ]; then
    # Move markdown files to design
    for file in Wireframes/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            mv "$file" docs/design/
            print_success "Moved $filename → docs/design/"
        fi
    done
    
    # Move HTML files to wireframes
    for file in Wireframes/*.html; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            mv "$file" docs/wireframes/
            print_success "Moved $filename → docs/wireframes/"
        fi
    done
    
    # Remove empty Wireframes directory
    if [ -z "$(ls -A Wireframes 2>/dev/null)" ]; then
        rmdir Wireframes
        print_success "Removed empty Wireframes directory"
    else
        print_warning "Wireframes directory not empty, leaving it"
    fi
fi

# Move database files
echo ""
echo "💾 Moving database files..."
if [ -f "init-db.sql" ]; then
    mv init-db.sql database/
    print_success "Moved init-db.sql"
fi

# Copy schema to database directory (keep reference in architecture too)
if [ -f "docs/architecture/DATABASE_SCHEMA.sql" ]; then
    cp docs/architecture/DATABASE_SCHEMA.sql database/schema.sql
    print_success "Copied DATABASE_SCHEMA.sql → database/schema.sql"
fi

# Update file references
echo ""
echo "🔗 Updating file references..."

# Update README.md
if [ -f "README.md" ]; then
    echo "  Updating README.md..."
    # Use sed for in-place editing (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|docs/Deeldesk_PRD_v4_0.docx|docs/product/Deeldesk_PRD_v4_0.docx|g' README.md
        sed -i '' 's|docs/Deeldesk_Sprint_Plan_Phase0_MVP.md|docs/planning/SPRINT_PLAN.md|g' README.md
        sed -i '' 's|DATABASE_SCHEMA.sql|docs/architecture/DATABASE_SCHEMA.sql|g' README.md
        sed -i '' 's|Deeldesk_Sprint_Plan_Phase0_MVP.md|docs/planning/SPRINT_PLAN.md|g' README.md
    else
        # Linux
        sed -i 's|docs/Deeldesk_PRD_v4_0.docx|docs/product/Deeldesk_PRD_v4_0.docx|g' README.md
        sed -i 's|docs/Deeldesk_Sprint_Plan_Phase0_MVP.md|docs/planning/SPRINT_PLAN.md|g' README.md
        sed -i 's|DATABASE_SCHEMA.sql|docs/architecture/DATABASE_SCHEMA.sql|g' README.md
        sed -i 's|Deeldesk_Sprint_Plan_Phase0_MVP.md|docs/planning/SPRINT_PLAN.md|g' README.md
    fi
    print_success "Updated README.md"
fi

# Update CLAUDE.md
if [ -f "CLAUDE.md" ]; then
    echo "  Updating CLAUDE.md..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|Deeldesk_Sprint_Plan_Phase0_MVP.md|docs/planning/SPRINT_PLAN.md|g' CLAUDE.md
        sed -i '' 's|DATABASE_SCHEMA.sql|docs/architecture/DATABASE_SCHEMA.sql|g' CLAUDE.md
        sed -i '' 's|LLM_PROVIDER_ARCHITECTURE.md|docs/architecture/LLM_PROVIDER_ARCHITECTURE.md|g' CLAUDE.md
        sed -i '' 's|Deeldesk_PRD_v4_0.docx|docs/product/Deeldesk_PRD_v4_0.docx|g' CLAUDE.md
    else
        sed -i 's|Deeldesk_Sprint_Plan_Phase0_MVP.md|docs/planning/SPRINT_PLAN.md|g' CLAUDE.md
        sed -i 's|DATABASE_SCHEMA.sql|docs/architecture/DATABASE_SCHEMA.sql|g' CLAUDE.md
        sed -i 's|LLM_PROVIDER_ARCHITECTURE.md|docs/architecture/LLM_PROVIDER_ARCHITECTURE.md|g' CLAUDE.md
        sed -i 's|Deeldesk_PRD_v4_0.docx|docs/product/Deeldesk_PRD_v4_0.docx|g' CLAUDE.md
    fi
    print_success "Updated CLAUDE.md"
fi

# Update planning documents that reference other docs
if [ -f "docs/planning/IMPLEMENTATION_PLAN.md" ]; then
    echo "  Updating IMPLEMENTATION_PLAN.md references..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|Deeldesk_Sprint_Plan_Phase0_MVP.md|SPRINT_PLAN.md|g' docs/planning/IMPLEMENTATION_PLAN.md
        sed -i '' 's|DATABASE_SCHEMA.sql|../architecture/DATABASE_SCHEMA.sql|g' docs/planning/IMPLEMENTATION_PLAN.md
    else
        sed -i 's|Deeldesk_Sprint_Plan_Phase0_MVP.md|SPRINT_PLAN.md|g' docs/planning/IMPLEMENTATION_PLAN.md
        sed -i 's|DATABASE_SCHEMA.sql|../architecture/DATABASE_SCHEMA.sql|g' docs/planning/IMPLEMENTATION_PLAN.md
    fi
    print_success "Updated IMPLEMENTATION_PLAN.md"
fi

# Update design documents that reference other docs
for file in docs/design/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "  Updating $filename references..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's|\.\./DESIGN_SYSTEM.md|DESIGN_SYSTEM.md|g' "$file"
            sed -i '' 's|\.\./NAVIGATION_SYSTEM.md|NAVIGATION_SYSTEM.md|g' "$file"
            sed -i '' 's|\.\./UX_GUIDE.md|UX_GUIDE.md|g' "$file"
        else
            sed -i 's|\.\./DESIGN_SYSTEM.md|DESIGN_SYSTEM.md|g' "$file"
            sed -i 's|\.\./NAVIGATION_SYSTEM.md|NAVIGATION_SYSTEM.md|g' "$file"
            sed -i 's|\.\./UX_GUIDE.md|UX_GUIDE.md|g' "$file"
        fi
    fi
done

# Create .gitkeep files to ensure directories are tracked
echo ""
echo "📝 Creating .gitkeep files..."
touch docs/planning/.gitkeep
touch docs/architecture/.gitkeep
touch docs/product/.gitkeep
touch docs/design/.gitkeep
touch docs/wireframes/.gitkeep
touch database/.gitkeep
print_success "Created .gitkeep files"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Migration complete!${NC}"
echo ""
echo "📊 Summary:"
echo "  • Planning documents: docs/planning/"
echo "  • Architecture documents: docs/architecture/"
echo "  • Product documents: docs/product/"
echo "  • Design documents: docs/design/"
echo "  • Wireframes: docs/wireframes/"
echo "  • Database files: database/"
echo ""
echo "📚 Next steps:"
echo "  1. Review the new structure"
echo "  2. Check updated file references"
echo "  3. Commit changes to git"
echo "  4. Update any external references"
echo ""
echo "💡 Tip: See docs/README.md for documentation index"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

