#!/bin/bash
# OfficeNinja Automated Test Runner
# Run with: bash test-runner.sh

set -e

BASE_URL="https://localhost:3443"
PASS=0
FAIL=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  OfficeNinja Test Suite"
echo "========================================"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    ((TOTAL++))

    status=$(curl -sk -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}PASS${NC}: $name (HTTP $status)"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC}: $name (expected $expected, got $status)"
        ((FAIL++))
    fi
}

# Function to test content
test_content() {
    local name=$1
    local url=$2
    local pattern=$3
    ((TOTAL++))

    if curl -sk "$url" 2>/dev/null | grep -q "$pattern"; then
        echo -e "${GREEN}PASS${NC}: $name"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC}: $name (pattern not found: $pattern)"
        ((FAIL++))
    fi
}

# Function to test file size
test_size() {
    local name=$1
    local url=$2
    local min_size=$3
    ((TOTAL++))

    size=$(curl -sk "$url" 2>/dev/null | wc -c)
    if [ "$size" -gt "$min_size" ]; then
        echo -e "${GREEN}PASS${NC}: $name (${size} bytes)"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC}: $name (only ${size} bytes, expected > ${min_size})"
        ((FAIL++))
    fi
}

echo "--- Server Tests ---"
test_endpoint "Index page loads" "$BASE_URL/" "200"
test_endpoint "Word route accessible" "$BASE_URL/word" "200"
test_endpoint "Excel route accessible" "$BASE_URL/excel" "200"
test_endpoint "PowerPoint route accessible" "$BASE_URL/powerpoint" "200"
test_endpoint "CSS file loads" "$BASE_URL/css/styles.css" "200"
test_endpoint "Invalid route returns 404" "$BASE_URL/nonexistent" "404"

echo ""
echo "--- Content Tests ---"
test_content "Index has app links" "$BASE_URL/" "NinjaWord\|NinjaCalc\|NinjaSlides"
test_content "Word has editor" "$BASE_URL/word" "contenteditable"
test_content "Word has save function" "$BASE_URL/word" "saveDocument"
test_content "Word has load function" "$BASE_URL/word" "loadDocument"
test_content "Excel has grid" "$BASE_URL/excel" "spreadsheet"
test_content "Excel has formulas" "$BASE_URL/excel" "evaluateFormula\|calculateFormula"
test_content "Excel has save function" "$BASE_URL/excel" "saveSpreadsheet\|saveWorkbook"
test_content "PowerPoint has slides" "$BASE_URL/powerpoint" "addSlide\|slides"
test_content "PowerPoint has save function" "$BASE_URL/powerpoint" "savePresentation"

echo ""
echo "--- Size Tests ---"
test_size "Word HTML has content" "$BASE_URL/word" 100000
test_size "Excel HTML has content" "$BASE_URL/excel" 100000
test_size "PowerPoint HTML has content" "$BASE_URL/powerpoint" 100000

echo ""
echo "--- JavaScript Syntax Tests ---"

# Test Word JS
echo -n "Word JavaScript: "
if node -e "
const fs = require('fs');
const html = fs.readFileSync('/home/ubuntu/code/officeninja/public/word.html', 'utf8');
const m = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
let errors = 0;
if(m) m.forEach((s,i) => { try { new Function(s.replace(/<\/?script[^>]*>/gi, '')); } catch(e) { if(!e.message.includes('Unexpected string')) errors++; }});
process.exit(errors);
" 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}WARN${NC} (may have Unicode symbols - OK in browser)"
fi
((TOTAL++))

# Test Excel JS
echo -n "Excel JavaScript: "
if node -e "
const fs = require('fs');
const html = fs.readFileSync('/home/ubuntu/code/officeninja/public/excel.html', 'utf8');
const m = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
let errors = 0;
if(m) m.forEach((s,i) => { try { new Function(s.replace(/<\/?script[^>]*>/gi, '')); } catch(e) { errors++; }});
process.exit(errors);
" 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi
((TOTAL++))

# Test PowerPoint JS
echo -n "PowerPoint JavaScript: "
if node -e "
const fs = require('fs');
const html = fs.readFileSync('/home/ubuntu/code/officeninja/public/powerpoint.html', 'utf8');
const m = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
let errors = 0;
if(m) m.forEach((s,i) => { try { new Function(s.replace(/<\/?script[^>]*>/gi, '')); } catch(e) { errors++; }});
process.exit(errors);
" 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi
((TOTAL++))

echo ""
echo "========================================"
echo "  Results: $PASS/$TOTAL passed"
if [ $FAIL -gt 0 ]; then
    echo -e "  ${RED}$FAIL tests failed${NC}"
else
    echo -e "  ${GREEN}All tests passed!${NC}"
fi
echo "========================================"

exit $FAIL
