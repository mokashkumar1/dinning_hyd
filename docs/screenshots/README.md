# 📸 ShifaAI Screenshot Asset Catalog & Capture Guide

This directory currently contains no screenshots. Use this guide to capture and add real product images before referencing them from the project README. Do not present the planned file names below as existing assets.

---

## 📐 Recommended Image Specifications

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Resolution** | `1920 x 1080 px` | Full HD 16:9 aspect ratio |
| **Format** | `PNG` (lossless) | Crisp typography and interface borders |
| **Color Space** | sRGB | Standard web rendering |
| **Browser State** | 100% zoom, clean browser window (F11 or headless screenshot) | Hide OS taskbar and browser bookmarks bar |
| **Target Folder** | `docs/screenshots/` | Match exact file names below |

---

## 📋 Required Shot List

| # | File Name | Route / Viewport | State & Language | What to Show in Frame |
| :-: | :--- | :--- | :--- | :--- |
| **01** | `01-landing-hero.png` | `/` (Desktop, 1920x1080) | Light Mode, English | Top header, brand mark, hero title ("Understand your prescription. Find the right care."), dual CTA buttons (`Scan Doctor Prescription`, `Find Available Hospital Bed`), and the real-time care availability snapshot card on the right. |
| **02** | `02-prescription-scanner.png` | `/#rx-scanner` | Light Mode, English | Prescription Scanner drag-and-drop zone with animated radar scan line active, camera capture button, and the 4 clinical preset chips visible. |
| **03** | `03-ai-dosage-timeline.png` | `/#rx-scanner` | Light Mode, English | Decoded medication cards (Augmentin, Panadol, Montiget, Ventolin) showing scheduled times (Morning, Afternoon, Bedtime), food relation badges, and Explainable AI confidence scores (96% overall). |
| **04** | `04-urdu-nastaliq-view.png` | `/#rx-scanner` | Dark ICU Mode, Urdu (اردو) | The entire application in Urdu RTL layout with **Noto Nastaliq Urdu** font typography, Urdu audio guide playing with waveform animation, and Urdu contraindication warnings. |
| **05** | `05-regional-telemetry-pulse.png` | `/#live-pulse` | Dark ICU Mode, English | Real-time regional telemetry strip: 6 Reporting Hospitals, 74% Regional ICU Load with gradient bar, 25 Free Ventilators, and 9 Active Ambulances dispatched. |
| **06** | `06-bedgrid-triage-map.png` | `/#bed-grid` | Light Mode, English | Interactive Leaflet GIS map of Hyderabad showing colored hospital pins (LUMHS City, Red Crescent, St. Elizabeth, Rajputana, Isra University, LUMHS Jamshoro) alongside triage filters and search prompt chips. |
| **07** | `07-bed-hold-pass.png` | Modal on `/#bed-grid` | Light Mode, English | 45-Minute Emergency Bed Hold Pass modal with live countdown timer (`44:58`), generated pass code (`SHIFA-8F2A1C`), QR code graphic, receiving hospital info, and coordinator direct-call button. |
| **08** | `08-staff-portal-login.png` | `/staff` | Light Mode, English | Staff authentication portal showing the Sign In tab, the Hackathon Preview / Judge Demo credentials card with 1-click login buttons for Admin, Coordinator, and Staff. |
| **09** | `09-coordinator-dashboard.png` | `/staff/coordinator` | Light Mode, English | Emergency Coordinator Command Dashboard displaying open cases, dispatch KPI cards, staff assignment dropdowns, case status selectors, and active on-duty staff roster. |
| **10** | `10-admin-access-mgmt.png` | `/staff/admin` | Dark Mode, English | Admin workspace showing system-wide emergency case log and the Staff Access Management list with role assignment dropdowns (Admin, Coordinator, Staff, Pending). |
| **11** | `11-mobile-responsive.png` | `/` (Mobile, 390x844) | Light Mode, Urdu or English | Mobile viewport demonstrating responsive stacked layout: mobile camera capture button, collapsible prescription cards, and responsive BedGrid cards with touch-friendly 44px hit targets. |

---

## 🛠️ Step-by-Step Capture Instructions

1. **Launch the development server with demo credentials enabled**:
   ```bash
   npm run dev
   ```
2. **Open Chrome / Edge at `http://localhost:3000`**.
3. **Capture Desktop Shots (`01` through `10`)**:
   - Open Developer Tools (`F12`), press `Ctrl + Shift + P`, and type `Capture full size screenshot` or set device emulation to `Responsive: 1920 x 1080`.
   - For **Shot 02 & 03**: Click **Scenario 1 (Respiratory / Infection)** to populate the decoded prescription view.
   - For **Shot 04**: Click the language switcher in the header, select **اردو (Urdu)**, toggle **Dark Mode**, and click **Urdu Voice (اردو میں سنیں)**.
   - For **Shot 07**: Scroll to **Care Availability**, click **Hold Bed for 45 Mins** on any hospital card to open the digital referral pass modal.
   - For **Shot 08**: Click **Staff Sign In** in the header.
   - For **Shot 09**: In the Staff portal, click **Sign In as Coordinator** to open `/staff/coordinator`.
   - For **Shot 10**: Sign out, then click **Sign In as Admin** to open `/staff/admin`.
4. **Capture Mobile Shot (`11`)**:
   - In Developer Tools, toggle Device Toolbar (`Ctrl + Shift + M`), choose **iPhone 14 Pro** or set dimensions to `390 x 844 px`.
   - Scroll through the landing page and capture the responsive mobile flow.
5. **Save and Optimize**:
   - Save all files as `docs/screenshots/01-landing-hero.png`, `docs/screenshots/02-prescription-scanner.png`, etc.
   - Run an image optimizer like `pngquant` or TinyPNG if needed to keep individual file sizes under 2 MB.
