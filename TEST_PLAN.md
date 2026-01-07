# OfficeNinja Comprehensive Test Plan

This document outlines comprehensive tests for OfficeNinja, covering both **Command Line/API** tests and **Chrome Browser Automation** tests.

---

## Table of Contents
1. [Server & Infrastructure Tests](#1-server--infrastructure-tests)
2. [NinjaWord Tests](#2-ninjaword-document-editor-tests)
3. [NinjaCalc Tests](#3-ninjacalc-spreadsheet-tests)
4. [NinjaSlides Tests](#4-ninjaslides-presentation-tests)
5. [Cross-Application Tests](#5-cross-application-tests)

---

## 1. Server & Infrastructure Tests

### 1.1 Command Line/API Tests

| Test ID | Test Name | Method | Expected Result |
|---------|-----------|--------|-----------------|
| SRV-001 | HTTPS server starts | `curl -k https://localhost:3443` | 200 OK response |
| SRV-002 | HTTP redirect (if implemented) | `curl http://localhost:3000` | Redirect to HTTPS |
| SRV-003 | Index page loads | `curl -k https://localhost:3443/` | Returns index.html content |
| SRV-004 | Word route accessible | `curl -k https://localhost:3443/word` | Returns word.html content |
| SRV-005 | Excel route accessible | `curl -k https://localhost:3443/excel` | Returns excel.html content |
| SRV-006 | PowerPoint route accessible | `curl -k https://localhost:3443/powerpoint` | Returns powerpoint.html content |
| SRV-007 | Static CSS loads | `curl -k https://localhost:3443/css/styles.css` | Returns CSS content |
| SRV-008 | Invalid route returns 404 | `curl -k https://localhost:3443/invalid` | 404 error |
| SRV-009 | SSL certificate valid | `openssl s_client -connect localhost:3443` | Certificate info displayed |
| SRV-010 | Response headers secure | `curl -kI https://localhost:3443` | Proper content-type headers |

### 1.2 Chrome Browser Tests

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| SRV-B01 | Landing page renders | Navigate to https://localhost:3443 | Dashboard with 3 app links visible |
| SRV-B02 | Navigation to Word | Click Word link | Word editor loads |
| SRV-B03 | Navigation to Excel | Click Excel link | Excel editor loads |
| SRV-B04 | Navigation to PowerPoint | Click PowerPoint link | PowerPoint editor loads |
| SRV-B05 | Back navigation works | Use browser back button | Returns to previous page |
| SRV-B06 | Page title correct | Check document.title | Shows "OfficeNinja" or app name |

---

## 2. NinjaWord (Document Editor) Tests

### 2.1 Command Line/API Tests

| Test ID | Test Name | Method | Expected Result |
|---------|-----------|--------|-----------------|
| WRD-001 | Word HTML valid | `curl -k https://localhost:3443/word \| grep -c "<html"` | Returns 1 |
| WRD-002 | Required libraries load | Check for jsPDF, Mammoth, docx CDN links | All CDN URLs present |
| WRD-003 | Page size acceptable | `curl -k https://localhost:3443/word -o /dev/null -w '%{size_download}'` | < 2MB |

### 2.2 Chrome Browser Tests - Core Features

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| WRD-B01 | Editor loads | Navigate to /word | ContentEditable area visible |
| WRD-B02 | Type text | Click editor, type "Hello World" | Text appears in editor |
| WRD-B03 | Bold formatting | Select text, click Bold (or Ctrl+B) | Text becomes bold |
| WRD-B04 | Italic formatting | Select text, click Italic (or Ctrl+I) | Text becomes italic |
| WRD-B05 | Underline formatting | Select text, click Underline (or Ctrl+U) | Text becomes underlined |
| WRD-B06 | Font size change | Select text, change font size dropdown | Text size changes |
| WRD-B07 | Font family change | Select text, change font dropdown | Font changes |
| WRD-B08 | Text color change | Select text, choose text color | Color applied |
| WRD-B09 | Highlight color | Select text, choose highlight | Background color applied |
| WRD-B10 | Alignment - Left | Click align left | Text aligns left |
| WRD-B11 | Alignment - Center | Click align center | Text centers |
| WRD-B12 | Alignment - Right | Click align right | Text aligns right |
| WRD-B13 | Alignment - Justify | Click justify | Text justifies |
| WRD-B14 | Bullet list | Click bullet list | Bullets appear |
| WRD-B15 | Numbered list | Click numbered list | Numbers appear |
| WRD-B16 | Indent increase | Click increase indent | Text indents right |
| WRD-B17 | Indent decrease | Click decrease indent | Text indents left |

### 2.3 Chrome Browser Tests - Save/Load

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| WRD-B20 | Save document | Create content, File > Save | Document saved to localStorage |
| WRD-B21 | Load document | File > Open, select saved doc | Document content restored |
| WRD-B22 | New document | File > New | Editor cleared |
| WRD-B23 | Document persistence | Save doc, refresh page, load | Content intact |
| WRD-B24 | Multiple documents | Save multiple docs with different names | All docs appear in open dialog |
| WRD-B25 | Delete document | Delete a saved document | Document removed from list |
| WRD-B26 | Export as JSON | Export document | JSON file downloads |
| WRD-B27 | Export as DOCX | Export as DOCX | .docx file downloads |
| WRD-B28 | Import DOCX | Import a .docx file | Content loads in editor |
| WRD-B29 | Export as PDF | Export as PDF | PDF file downloads |
| WRD-B30 | Print preview | File > Print | Print dialog appears |

### 2.4 Chrome Browser Tests - Advanced Features

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| WRD-B40 | Undo | Make change, Ctrl+Z | Change reverted |
| WRD-B41 | Redo | Undo, then Ctrl+Y | Change restored |
| WRD-B42 | Find text | Ctrl+F, search term | Matches highlighted |
| WRD-B43 | Find and replace | Find > Replace, replace text | Text replaced |
| WRD-B44 | Spell check | Type misspelled word | Red underline appears |
| WRD-B45 | Add to dictionary | Right-click misspelled, add | Word no longer flagged |
| WRD-B46 | Insert table | Insert > Table | Table inserted |
| WRD-B47 | Insert image | Insert > Image | Image appears |
| WRD-B48 | Insert hyperlink | Insert > Link | Link functional |
| WRD-B49 | Track changes on | Enable track changes | Changes tracked |
| WRD-B50 | Accept change | Accept tracked change | Change applied |
| WRD-B51 | Reject change | Reject tracked change | Change reverted |
| WRD-B52 | Add comment | Add comment to text | Comment appears |
| WRD-B53 | Sticky notes | Add sticky note | Note visible, draggable |
| WRD-B54 | Templates | Apply template | Template content loaded |
| WRD-B55 | Zoom in/out | Use zoom controls | View zooms |
| WRD-B56 | Dark mode toggle | Toggle dark mode | Theme switches |
| WRD-B57 | Command palette | Ctrl+K | Palette opens |
| WRD-B58 | Split view | Enable split view | Two panes visible |
| WRD-B59 | Auto-correct | Type "teh" | Corrects to "the" |
| WRD-B60 | Insert symbol | Insert > Symbol | Symbol inserted |

---

## 3. NinjaCalc (Spreadsheet) Tests

### 3.1 Command Line/API Tests

| Test ID | Test Name | Method | Expected Result |
|---------|-----------|--------|-----------------|
| XLS-001 | Excel HTML valid | `curl -k https://localhost:3443/excel \| grep -c "<html"` | Returns 1 |
| XLS-002 | Handsontable loads | Check for Handsontable CDN | CDN URL present |
| XLS-003 | Chart.js loads | Check for Chart.js CDN | CDN URL present |

### 3.2 Chrome Browser Tests - Core Features

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| XLS-B01 | Grid loads | Navigate to /excel | Spreadsheet grid visible |
| XLS-B02 | Enter text | Click cell A1, type "Test" | Text appears in cell |
| XLS-B03 | Enter number | Click cell B1, type "100" | Number appears in cell |
| XLS-B04 | Navigate cells | Arrow keys | Selection moves |
| XLS-B05 | Tab navigation | Tab key | Moves to next cell |
| XLS-B06 | Enter navigation | Enter key | Moves down one cell |
| XLS-B07 | Cell selection range | Shift+click | Range selected |
| XLS-B08 | Copy cell | Ctrl+C on cell | Cell copied |
| XLS-B09 | Paste cell | Ctrl+V | Content pasted |
| XLS-B10 | Cut cell | Ctrl+X | Content cut |
| XLS-B11 | Delete content | Select, Delete key | Content cleared |
| XLS-B12 | Cell formatting bold | Select, click Bold | Cell text bold |
| XLS-B13 | Cell background color | Select, choose fill color | Background changes |
| XLS-B14 | Cell border | Select, apply border | Border appears |
| XLS-B15 | Text alignment | Select, align center | Text centers |
| XLS-B16 | Number format currency | Format as currency | $ symbol appears |
| XLS-B17 | Number format percent | Format as percent | % symbol appears |

### 3.3 Chrome Browser Tests - Formulas

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| XLS-B20 | SUM formula | `=SUM(A1:A5)` | Correct sum calculated |
| XLS-B21 | AVERAGE formula | `=AVERAGE(A1:A5)` | Correct average |
| XLS-B22 | COUNT formula | `=COUNT(A1:A5)` | Correct count |
| XLS-B23 | MAX formula | `=MAX(A1:A5)` | Correct maximum |
| XLS-B24 | MIN formula | `=MIN(A1:A5)` | Correct minimum |
| XLS-B25 | IF formula | `=IF(A1>10,"Yes","No")` | Correct result |
| XLS-B26 | VLOOKUP formula | Test VLOOKUP | Correct lookup |
| XLS-B27 | CONCATENATE | `=CONCATENATE(A1,B1)` | Strings joined |
| XLS-B28 | Formula error | `=1/0` | Error displayed |
| XLS-B29 | Cell reference | `=A1+B1` | Sum of cells |
| XLS-B30 | Absolute reference | `=$A$1+B1` | Reference works |
| XLS-B31 | Cross-sheet reference | Reference another sheet | Value retrieved |

### 3.4 Chrome Browser Tests - Save/Load

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| XLS-B40 | Save spreadsheet | Create data, Save | Saved to localStorage |
| XLS-B41 | Load spreadsheet | Open saved spreadsheet | Data restored |
| XLS-B42 | New spreadsheet | File > New | Grid cleared |
| XLS-B43 | Export XLSX | Export as XLSX | .xlsx file downloads |
| XLS-B44 | Import XLSX | Import .xlsx file | Data loads correctly |
| XLS-B45 | Export CSV | Export as CSV | .csv file downloads |
| XLS-B46 | Export HTML | Export as HTML | .html file downloads |
| XLS-B47 | Multiple sheets save | Save workbook with multiple sheets | All sheets persist |

### 3.5 Chrome Browser Tests - Advanced Features

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| XLS-B50 | Insert row | Insert > Row | New row added |
| XLS-B51 | Insert column | Insert > Column | New column added |
| XLS-B52 | Delete row | Delete row | Row removed |
| XLS-B53 | Delete column | Delete column | Column removed |
| XLS-B54 | Hide row | Hide row | Row hidden |
| XLS-B55 | Hide column | Hide column | Column hidden |
| XLS-B56 | Merge cells | Select range, merge | Cells merged |
| XLS-B57 | Unmerge cells | Unmerge | Cells separated |
| XLS-B58 | Freeze panes | Freeze first row | Row stays visible on scroll |
| XLS-B59 | Sort ascending | Sort A-Z | Data sorted |
| XLS-B60 | Sort descending | Sort Z-A | Data sorted reverse |
| XLS-B61 | Filter data | Apply filter | Filter dropdown appears |
| XLS-B62 | Conditional format | Apply condition | Formatting applies |
| XLS-B63 | Insert chart | Insert > Chart | Chart appears |
| XLS-B64 | Chart type change | Change chart type | Chart updates |
| XLS-B65 | Pivot table | Create pivot table | Pivot table renders |
| XLS-B66 | Named range | Create named range | Range accessible by name |
| XLS-B67 | Data validation | Add dropdown validation | Dropdown appears |
| XLS-B68 | Format painter | Copy format to other cells | Format applied |
| XLS-B69 | Auto-fit column | Double-click column border | Column fits content |
| XLS-B70 | Add new sheet | Click + button | New sheet tab appears |

---

## 4. NinjaSlides (Presentation) Tests

### 4.1 Command Line/API Tests

| Test ID | Test Name | Method | Expected Result |
|---------|-----------|--------|-----------------|
| PPT-001 | PowerPoint HTML valid | `curl -k https://localhost:3443/powerpoint \| grep -c "<html"` | Returns 1 |
| PPT-002 | pptxgenjs loads | Check for pptxgenjs CDN | CDN URL present |

### 4.2 Chrome Browser Tests - Core Features

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| PPT-B01 | Editor loads | Navigate to /powerpoint | Slide editor visible |
| PPT-B02 | Default slide | First slide present | Title slide visible |
| PPT-B03 | Add text box | Insert > Text Box, click slide | Text box appears |
| PPT-B04 | Edit text | Double-click text box, type | Text editable |
| PPT-B05 | Move element | Drag element | Element repositions |
| PPT-B06 | Resize element | Drag resize handles | Element resizes |
| PPT-B07 | Delete element | Select, Delete key | Element removed |
| PPT-B08 | Add rectangle | Insert > Shape > Rectangle | Rectangle appears |
| PPT-B09 | Add circle | Insert > Shape > Circle | Circle appears |
| PPT-B10 | Add arrow | Insert > Shape > Arrow | Arrow appears |
| PPT-B11 | Shape fill color | Select shape, change fill | Color changes |
| PPT-B12 | Shape border | Select shape, change border | Border updates |
| PPT-B13 | Text formatting | Bold, italic in text box | Formatting applies |

### 4.3 Chrome Browser Tests - Slide Management

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| PPT-B20 | Add new slide | Click + or Insert > Slide | New slide added |
| PPT-B21 | Delete slide | Select slide, delete | Slide removed |
| PPT-B22 | Duplicate slide | Duplicate slide | Copy created |
| PPT-B23 | Reorder slides | Drag slide in panel | Order changes |
| PPT-B24 | Slide templates | Apply template | Template layout applied |
| PPT-B25 | Slide thumbnails | View thumbnail panel | Thumbnails visible |
| PPT-B26 | Navigate slides | Click different slides | Active slide changes |

### 4.4 Chrome Browser Tests - Save/Load

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| PPT-B30 | Save presentation | Create slides, Save | Saved to localStorage |
| PPT-B31 | Load presentation | Open saved presentation | Slides restored |
| PPT-B32 | New presentation | File > New | Editor cleared |
| PPT-B33 | Export PPTX | Export as PPTX | .pptx file downloads |
| PPT-B34 | Import PPTX | Import .pptx file | Slides load |
| PPT-B35 | Export PDF | Export as PDF | PDF downloads |
| PPT-B36 | Export HTML | Export as HTML | HTML downloads |

### 4.5 Chrome Browser Tests - Advanced Features

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| PPT-B40 | Insert image | Insert > Image | Image appears on slide |
| PPT-B41 | Insert video | Insert > Video | Video player appears |
| PPT-B42 | Insert audio | Insert > Audio | Audio control appears |
| PPT-B43 | Add animation | Select element, add animation | Animation configured |
| PPT-B44 | Add transition | Select slide, add transition | Transition set |
| PPT-B45 | Speaker notes | Add speaker notes | Notes saved |
| PPT-B46 | Presenter view | Start presenter view | Two views display |
| PPT-B47 | Slideshow mode | Start slideshow | Full-screen presentation |
| PPT-B48 | Navigate slideshow | Arrow keys in slideshow | Slides advance |
| PPT-B49 | Exit slideshow | Esc key | Returns to editor |
| PPT-B50 | Group elements | Select multiple, group | Elements grouped |
| PPT-B51 | Ungroup elements | Ungroup | Elements separated |
| PPT-B52 | Align elements | Select multiple, align | Elements aligned |
| PPT-B53 | Distribute elements | Distribute evenly | Even spacing |
| PPT-B54 | Z-order front | Bring to front | Element on top |
| PPT-B55 | Z-order back | Send to back | Element behind |
| PPT-B56 | Lock element | Lock element | Element not movable |
| PPT-B57 | Flip horizontal | Flip element | Element flipped |
| PPT-B58 | Flip vertical | Flip element | Element flipped |
| PPT-B59 | QR code insert | Insert > QR Code | QR code appears |
| PPT-B60 | Screen recording | Record screen | Recording works |

---

## 5. Cross-Application Tests

### 5.1 Command Line/API Tests

| Test ID | Test Name | Method | Expected Result |
|---------|-----------|--------|-----------------|
| CRS-001 | All routes respond | Test all 4 main routes | All return 200 |
| CRS-002 | Response times | Measure curl response times | All < 2 seconds |
| CRS-003 | Concurrent requests | `ab -n 100 -c 10` | No failures |

### 5.2 Chrome Browser Tests

| Test ID | Test Name | Actions | Expected Result |
|---------|-----------|---------|-----------------|
| CRS-B01 | Switch apps preserves data | Save in Word, switch to Excel, back to Word | Data intact |
| CRS-B02 | Multiple tabs | Open all 3 apps in tabs | All function independently |
| CRS-B03 | Dark mode persists | Enable dark mode, refresh | Dark mode stays |
| CRS-B04 | Keyboard shortcuts | Test common shortcuts | All work correctly |
| CRS-B05 | Copy between apps | Copy from Word, paste in PowerPoint | Content transfers |
| CRS-B06 | LocalStorage isolation | Save docs in all apps | No conflicts |
| CRS-B07 | Browser refresh | Refresh during editing | No data loss (if saved) |
| CRS-B08 | Browser resize | Resize window | UI adapts |
| CRS-B09 | Zoom levels | Browser zoom 50%-200% | UI remains functional |
| CRS-B10 | Console errors | Open DevTools console | No JavaScript errors |

---

## Test Execution Scripts

### Command Line Test Runner

```bash
#!/bin/bash
# test-server.sh - Run server API tests

BASE_URL="https://localhost:3443"
PASS=0
FAIL=0

test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3

    status=$(curl -sk -o /dev/null -w "%{http_code}" "$url")
    if [ "$status" = "$expected" ]; then
        echo "PASS: $name"
        ((PASS++))
    else
        echo "FAIL: $name (expected $expected, got $status)"
        ((FAIL++))
    fi
}

echo "=== OfficeNinja Server Tests ==="
test_endpoint "Index page" "$BASE_URL/" "200"
test_endpoint "Word route" "$BASE_URL/word" "200"
test_endpoint "Excel route" "$BASE_URL/excel" "200"
test_endpoint "PowerPoint route" "$BASE_URL/powerpoint" "200"
test_endpoint "CSS file" "$BASE_URL/css/styles.css" "200"
test_endpoint "Invalid route" "$BASE_URL/invalid" "404"

echo ""
echo "Results: $PASS passed, $FAIL failed"
```

### Chrome Browser Test Execution

For browser tests, use the Chrome automation tools:

1. **Start with `tabs_context_mcp`** to get browser context
2. **Create new tab with `tabs_create_mcp`**
3. **Navigate with `navigate`** to the application
4. **Use `read_page`** to inspect DOM elements
5. **Use `find`** to locate specific elements
6. **Use `computer`** for clicks, typing, screenshots
7. **Use `form_input`** for form fields
8. **Use `javascript_tool`** for localStorage verification

---

## Test Data Requirements

### Sample Files for Import Testing
- `test.docx` - Word document with formatting
- `test.xlsx` - Excel file with formulas and data
- `test.pptx` - PowerPoint with slides and media
- `test.csv` - CSV data file

### Expected LocalStorage Keys
- `ninjaword_documents`
- `ninjaword_stickynotes`
- `customDictionary`
- `ninjaword-darkmode`
- Excel equivalent keys
- PowerPoint equivalent keys

---

## Test Environment Requirements

1. **Server running**: `node server.js` on port 3443
2. **Chrome browser** with Claude-in-Chrome extension
3. **Valid SSL certificates** in `/certs` directory
4. **Network access** for CDN libraries
5. **Sufficient localStorage** space (~50MB recommended)

---

## Priority Test Categories

### P0 - Critical (Must Pass)
- Server starts and serves pages
- Basic text editing in all apps
- Save and load functionality
- File export (JSON, native formats)

### P1 - High Priority
- All formatting features
- Formula calculations (Excel)
- Slide management (PowerPoint)
- Import functionality

### P2 - Medium Priority
- Advanced features (track changes, animations, charts)
- Cross-app functionality
- Performance tests

### P3 - Low Priority
- Edge cases
- Stress testing
- Accessibility features
