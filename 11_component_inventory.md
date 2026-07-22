# 11 Component Inventory — v2 (System-wide)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `11_component_inventory.md` โดยขยายจาก inventory ที่เคยโฟกัสเกือบทั้งหมดกับ public-facing UI ไปสู่ **component system inventory** สำหรับทั้งแพลตฟอร์ม Industrial Property Platform v1 ซึ่งประกอบด้วย Public Website, Admin / Operations App และ Content & GEO Layer [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html][code_file:540].

เป้าหมายของเอกสารนี้คือทำให้ทุกฝ่ายมีภาษากลางร่วมกันเวลาพูดถึงองค์ประกอบของระบบ ไม่ว่าจะเป็น designer, frontend developer, backend developer, QA หรือ AI agent เพื่อหลีกเลี่ยงการนิยาม component แบบ ad hoc ตามหน้าจอเฉพาะกิจ [page:FUNCTIONAL_SPEC.html][code_file:540].

## หลักการของ component inventory

Inventory ฉบับนี้ยึด 4 หลักการ [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html]:

- Component ต้องถูกจัดตาม **บทบาทในระบบ** ไม่ใช่แค่ตามหน้าที่ visual [page:FUNCTIONAL_SPEC.html].
- ต้องแยก public components ออกจาก admin/ops components และ editorial components เพราะ workflow และ constraints ต่างกัน [page:REQUIREMENTS_SPEC.html][code_file:540].
- Component ที่ดูคล้ายกันแต่รับผิดชอบต่างกัน เช่น public filter bar กับ admin filter toolbar ไม่ควรถือเป็นตัวเดียวกันโดยอัตโนมัติ [page:FUNCTIONAL_SPEC.html].
- Inventory ต้องสะท้อน FR/NFR, state machine, role matrix และ data model implication ไม่ใช่เป็นเพียง style catalog [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html].

## หมวดองค์ประกอบหลัก

ชุด component ในระบบนี้แบ่งได้เป็น 6 families หลัก [code_file:540][page:FUNCTIONAL_SPEC.html]:

1. Foundational components
2. Public website components
3. Lead intake components
4. Admin / CRM / Ops components
5. Inventory / listing management components
6. CMS / SEO / GEO components

แต่ละหมวดจะมีทั้ง component ระดับ primitive, composite และ module-level workspace เพื่อให้ใช้ inventory นี้ได้ทั้งกับ design system และ implementation planning [code_file:540].

## 1. Foundational components

Foundational components คือองค์ประกอบฐานที่ถูกใช้ข้ามหลายส่วนของระบบ โดยเฉพาะ interaction patterns, layout wrappers และ status patterns [page:FUNCTIONAL_SPEC.html].  แม้หลายตัวจะมี visual form คล้ายกัน แต่ใน inventory นี้จะจัดไว้เป็น primitives ที่สามารถนำไป compose เป็น feature-specific components ได้ [code_file:540].

### 1.1 Layout primitives

- `AppShell` — shell layout สำหรับ admin routes พร้อม sidebar/header/content region [page:FUNCTIONAL_SPEC.html]
- `PublicPageShell` — shell สำหรับ public pages ที่รองรับ multilingual nav, footer, global CTA [page:REQUIREMENTS_SPEC.html]
- `SectionWrapper` — wrapper สำหรับ page sections [file:480][file:495][page:FUNCTIONAL_SPEC.html]
- `ContentContainer` — width container สำหรับ prose/content/layout blocks [page:FUNCTIONAL_SPEC.html]
- `SplitPanel` — two-column content layout สำหรับ detail/admin workspaces [page:FUNCTIONAL_SPEC.html]
- `DrawerSheet` — slide-over container สำหรับ mobile filters หรือ quick-edit panels [page:FUNCTIONAL_SPEC.html]
- `ModalDialog` — confirm / destructive / choose dialogs [page:FUNCTIONAL_SPEC.html]

### 1.2 Core interaction primitives

- `Button` — primary, secondary, ghost, destructive, icon-only variants [page:FUNCTIONAL_SPEC.html][file:483][file:484]
- `LinkButton` — action links styled as buttons [page:FUNCTIONAL_SPEC.html]
- `IconButton` — icon-only actions with tooltip/aria-label [page:FUNCTIONAL_SPEC.html]
- `TextInput` — single-line input [page:FUNCTIONAL_SPEC.html]
- `Textarea` — long-form input [page:FUNCTIONAL_SPEC.html]
- `SelectInput` — standard select/dropdown [page:FUNCTIONAL_SPEC.html]
- `Combobox` — searchable entity picker (listing, user, location) [page:FUNCTIONAL_SPEC.html]
- `Checkbox` — multi-select constraints [page:FUNCTIONAL_SPEC.html]
- `RadioGroup` — single-choice decision sets [page:FUNCTIONAL_SPEC.html]
- `DateInput` / `DateRangeInput` — visit dates, filter ranges, move-in dates [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- `NumberRangeInput` — size/budget min-max [page:REQUIREMENTS_SPEC.html]
- `Toggle` — boolean state เช่น featured, license possible [page:REQUIREMENTS_SPEC.html]
- `Tabs` — content grouping / translations / detail subviews [page:FUNCTIONAL_SPEC.html]
- `Accordion` — FAQ blocks, filter sections [file:460][page:FUNCTIONAL_SPEC.html]

### 1.3 Feedback & status primitives

- `Badge` — state/status/zone/type labels [page:REQUIREMENTS_SPEC.html][file:457]
- `StatusChip` — more semantic badge family สำหรับ workflow states [page:FUNCTIONAL_SPEC.html]
- `AlertBanner` — warnings, notices, policy messages [page:FUNCTIONAL_SPEC.html]
- `InlineError` — field-specific validation errors [page:REQUIREMENTS_SPEC.html]
- `Toast` — ephemeral notifications [page:FUNCTIONAL_SPEC.html]
- `EmptyState` — no-results / no-data surfaces [page:REQUIREMENTS_SPEC.html][file:457]
- `SkeletonBlock` — loading placeholders [page:FUNCTIONAL_SPEC.html]
- `HelperText` — explanatory text under inputs or panels [page:FUNCTIONAL_SPEC.html]

### 1.4 Data display primitives

- `DataCard` — generic content/stat card [page:FUNCTIONAL_SPEC.html]
- `DefinitionList` — specs/attributes display [page:REQUIREMENTS_SPEC.html][file:459]
- `Table` — tabular data display for admin [page:FUNCTIONAL_SPEC.html]
- `Pagination` — public listings and admin lists [page:REQUIREMENTS_SPEC.html]
- `Timeline` — activities/notes/history [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- `StatBlock` — KPI display [page:FUNCTIONAL_SPEC.html]
- `KeyValueGrid` — structured property or company metadata [page:FUNCTIONAL_SPEC.html]

## 2. Public website components

Public componentsคือชุดองค์ประกอบที่เน้น discoverability, trust, clarity และ conversion โดยไม่ต้องพึ่ง authenticated state [page:REQUIREMENTS_SPEC.html].  ในเชิง product components กลุ่มนี้เป็นหน้าแรกที่ผู้ใช้สัมผัส และส่งผลต่อทั้ง SEO performance และ conversion rate [page:FUNCTIONAL_SPEC.html].

### 2.1 Homepage components

จาก homepage structure เดิมและ FR-PUB, หน้า Home ควรประกอบด้วย component สำคัญดังนี้ [file:480][page:REQUIREMENTS_SPEC.html]:

- `HeroSection` — hero image/video + main headline + supporting copy [file:480]
- `QuickSearchModule` — ค้นหาแบบสั้นจากหน้าแรก [page:REQUIREMENTS_SPEC.html][file:480]
- `FeaturedListingsRail` — featured listings preview [page:REQUIREMENTS_SPEC.html][file:480]
- `MapIntroSection` หรือ `AreaDiscoveryPanel` — intro สู่พื้นที่ค้นหาหรือ map-led discovery [file:480]
- `HowItWorksGrid` — 4-step explanation tiles [file:480]
- `WhyChooseUsGrid` — differentiator/trust blocks [file:480]
- `CredentialLogoStrip` — associations / awards / certifications [file:480]
- `GalleryTrustSection` — social proof / activity visuals [file:480]
- `FooterContactBlock` — footer with company/contact/legal [file:480][file:460]

### 2.2 Listing search components

Listing discovery เป็นระบบ component family ใหญ่ เพราะมี filter state, card list, sort/pagination และ compare [page:REQUIREMENTS_SPEC.html][file:457].

#### Search controls

- `SearchToolbar` — top search summary + quick actions [page:FUNCTIONAL_SPEC.html]
- `FilterSidebar` — desktop filter panel [page:REQUIREMENTS_SPEC.html]
- `FilterBottomSheet` — mobile filter panel [page:FUNCTIONAL_SPEC.html]
- `FilterGroup` — group wrapper per filter section [page:FUNCTIONAL_SPEC.html]
- `PropertyTypeSelector` [page:REQUIREMENTS_SPEC.html]
- `TransactionTypeSelector` [page:REQUIREMENTS_SPEC.html]
- `LocationHierarchySelector` — province/district/subdistrict [page:REQUIREMENTS_SPEC.html]
- `IndustrialEstateSelector` — industrial estate / zone inputs [page:REQUIREMENTS_SPEC.html]
- `RangeFilter` — size / rent / sale ranges [page:REQUIREMENTS_SPEC.html]
- `BooleanFilterToggle` — featured / license possible [page:REQUIREMENTS_SPEC.html]
- `KeywordSearchInput` — full-text `q` [page:REQUIREMENTS_SPEC.html]
- `FilterSummaryBar` — selected chips + clear actions [page:FUNCTIONAL_SPEC.html]
- `SortDropdown` — published date / price / size [page:REQUIREMENTS_SPEC.html]

#### Listing results components

- `ResultCountLabel` — total + current window [page:REQUIREMENTS_SPEC.html][file:457]
- `ListingGrid` — grid/list container [page:FUNCTIONAL_SPEC.html]
- `ListingCard` — card showing cover, title, type, location, size, price, public_code [page:REQUIREMENTS_SPEC.html][file:457]
- `ListingCardBadgeRow` — zone/type/transaction badges [file:457][file:459]
- `ListingCardImage` — thumbnail with optional photo count [file:457]
- `PriceDisplay` — supports rent, sale, or dual price [file:457][page:REQUIREMENTS_SPEC.html]
- `NoResultsState` — empty state + reset/requirement CTA [page:REQUIREMENTS_SPEC.html][file:457]
- `CompareBar` — session compare tray [page:REQUIREMENTS_SPEC.html]
- `CompareTable` — side-by-side compare matrix [page:REQUIREMENTS_SPEC.html]

### 2.3 Listing detail components

Detail page componentsต้องออกแบบเพื่อรองรับทั้งการอ่าน specs และการทำ contact decision [page:REQUIREMENTS_SPEC.html][file:459].

- `Breadcrumbs` — visible page hierarchy [file:459][page:FUNCTIONAL_SPEC.html]
- `ListingGallery` — cover + thumbnails + lightbox [file:459][page:FUNCTIONAL_SPEC.html]
- `ListingTitleBlock` — title, code, primary tags [page:REQUIREMENTS_SPEC.html][file:459]
- `ListingQuickStatsRow` — key specs เช่น usable area, clear height, floor loading, power [file:459]
- `ListingSpecsGrid` — full attribute set [page:REQUIREMENTS_SPEC.html]
- `FeatureList` — highlights / amenities [file:459]
- `LocationSummaryCard` — public-safe location summary [page:REQUIREMENTS_SPEC.html]
- `MapCard` — obeys `map_visibility_level` [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- `AvailabilityNotice` — updated_at + disclaimer [page:REQUIREMENTS_SPEC.html]
- `InquirySidebar` หรือ `InquiryPanel` — listing-bound inquiry module [page:REQUIREMENTS_SPEC.html][file:458]
- `ContactChannelGroup` — Line / WeChat / WhatsApp / phone / email [page:REQUIREMENTS_SPEC.html][file:458]
- `RelatedListingsSection` — area/type nearby suggestions [page:REQUIREMENTS_SPEC.html]

### 2.4 Content page components

Public content familyใหม่ตามสเปกทำให้ต้องเพิ่ม component ชุด editorial และ GEO [page:REQUIREMENTS_SPEC.html].

#### FAQ

- `FaqCategoryNav` — category switcher/sidebar [file:460][page:REQUIREMENTS_SPEC.html]
- `FaqAccordionList` — grouped Q&A [page:REQUIREMENTS_SPEC.html]
- `StillNeedHelpCTA` — FAQ-to-contact escalation [file:460]

#### Guides / articles

- `ArticleCard` — article teaser [page:REQUIREMENTS_SPEC.html]
- `ArticleGrid` — hub layout [page:REQUIREMENTS_SPEC.html]
- `ArticleHeader` — title/meta/category [page:FUNCTIONAL_SPEC.html]
- `ArticleBodyRenderer` — rich content renderer [page:FUNCTIONAL_SPEC.html]
- `ArticleToc` — optional table of contents [page:FUNCTIONAL_SPEC.html]
- `ArticleCtaRail` — requirement/contact CTA in content [page:FUNCTIONAL_SPEC.html]

#### Service & area pages

- `ServiceHero` [page:REQUIREMENTS_SPEC.html]
- `ServiceSectionStack` [page:FUNCTIONAL_SPEC.html]
- `AreaHero` [page:REQUIREMENTS_SPEC.html]
- `AreaFactsPanel` [page:FUNCTIONAL_SPEC.html]
- `AreaMapSection` [page:REQUIREMENTS_SPEC.html]
- `AreaListingPreview` [page:FUNCTIONAL_SPEC.html]
- `AreaFaqSection` [page:REQUIREMENTS_SPEC.html]
- `InternalLinksPanel` — links to relevant services, guides, searches [page:FUNCTIONAL_SPEC.html]

## 3. Lead intake components

Lead intake ไม่ควรถูกมองว่าเป็นแค่ฟอร์มสองแบบ แต่ควรถูกจัดเป็น component family แยก เพราะเป็นจุดเชื่อมระหว่าง public กับ CRM [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].  Components กลุ่มนี้ต้องรองรับทั้ง low-friction contact และ structured requirement capture [page:REQUIREMENTS_SPEC.html].

### 3.1 General inquiry components

- `InquiryForm` — name, email, phone, message, language, optional listing binding [page:REQUIREMENTS_SPEC.html]
- `InquirySubjectSelect` — optional inquiry type selector [file:458]
- `LeadConsentNote` — privacy/compliance helper text [page:FUNCTIONAL_SPEC.html]
- `FormSubmitState` — success / error / pending [page:FUNCTIONAL_SPEC.html]

### 3.2 Requirement wizard components

- `RequirementWizard` — multi-step structured intake [page:REQUIREMENTS_SPEC.html]
- `WizardStepNav` — current step / next / back [page:FUNCTIONAL_SPEC.html]
- `CompanyProfileStep` — company name, registration country, website, business type [page:REQUIREMENTS_SPEC.html]
- `OperationTypeStep` — operation type / manufacturing profile [page:REQUIREMENTS_SPEC.html]
- `RequirementConstraintsStep` — license, size, budgets, move-in date [page:REQUIREMENTS_SPEC.html]
- `LocationPreferenceStep` — preferred areas + priority [page:REQUIREMENTS_SPEC.html]
- `NotesStep` — additional notes / proximity needs [page:REQUIREMENTS_SPEC.html]
- `WizardReviewStep` — summary before submit [page:FUNCTIONAL_SPEC.html]
- `ServerValidationSummary` — consolidated errors from backend [page:REQUIREMENTS_SPEC.html]
- `SpamProtectionLayer` — honeypot / rate-limit behavior hooks [page:REQUIREMENTS_SPEC.html]

### 3.3 Listing-bound contact components

- `ListingInquiryForm` — inquiry tied to listing_ids [page:REQUIREMENTS_SPEC.html]
- `StickyInquiryCta` — persistent CTA to inquiry form [page:FUNCTIONAL_SPEC.html]
- `PrefilledContextSummary` — listing title/code context in form [page:FUNCTIONAL_SPEC.html]

## 4. Admin / CRM / Ops components

ส่วนนี้คือกลุ่ม component ที่เดิมแทบไม่ถูก formalize แต่ในสเปก v1.1 ถือเป็นหัวใจของระบบ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][code_file:540].  component family กลุ่มนี้ต้องคิดเรื่อง permissions, state transitions, auditability และ dense information layout มากกว่า public UI [page:FUNCTIONAL_SPEC.html].

### 4.1 Admin shell components

- `AdminSidebar` — role-aware module nav [page:FUNCTIONAL_SPEC.html]
- `AdminHeader` — page title, search, quick actions, user menu [page:FUNCTIONAL_SPEC.html]
- `RoleAwareNavItem` — hides/shows based on permissions [page:REQUIREMENTS_SPEC.html]
- `ModuleToolbar` — actions, filters, export stub, search [page:FUNCTIONAL_SPEC.html]
- `BulkActionBar` — only where permitted [page:FUNCTIONAL_SPEC.html]

### 4.2 Lead management components

- `LeadTable` — filterable/paginated list [page:REQUIREMENTS_SPEC.html]
- `LeadStatusBadge` — state machine badge [page:REQUIREMENTS_SPEC.html]
- `LeadDetailHeader` — lead identity, company, assignee, status [page:FUNCTIONAL_SPEC.html]
- `LeadContactCard` — primary/secondary contacts [page:REQUIREMENTS_SPEC.html]
- `CompanySummaryCard` — company profile [page:REQUIREMENTS_SPEC.html]
- `RequirementSummaryCard` — key constraints [page:REQUIREMENTS_SPEC.html]
- `AssignmentControl` — assign lead to agent [page:REQUIREMENTS_SPEC.html]
- `NotesTimeline` — chronological notes [page:REQUIREMENTS_SPEC.html]
- `TaskListPanel` — task tracking with due dates/priority [page:REQUIREMENTS_SPEC.html]
- `ActivitiesLogPanel` — action history [page:REQUIREMENTS_SPEC.html]
- `CancelRequirementDialog` — mandatory reason + reason-type capture [page:REQUIREMENTS_SPEC.html]

### 4.3 Shortlist components

- `ShortlistTable` — shortlist index [page:FUNCTIONAL_SPEC.html]
- `ShortlistBuilder` — ranking/editing workspace [page:REQUIREMENTS_SPEC.html]
- `ListingSearchPicker` — search/add listing into shortlist [page:FUNCTIONAL_SPEC.html]
- `ShortlistItemRow` — rank, listing summary, notes, remove action [page:REQUIREMENTS_SPEC.html]
- `DuplicatePreventionNotice` — block duplicates [page:REQUIREMENTS_SPEC.html]
- `AvailabilityGateIndicator` — listing validity status [page:REQUIREMENTS_SPEC.html]
- `ShortlistSendAction` — send to client + set sent state [page:REQUIREMENTS_SPEC.html]
- `ClientFeedbackInput` — interested / not_interested / undecided [page:REQUIREMENTS_SPEC.html]
- `ClientTokenLinkPanel` — shareable client view link [page:SEQUENCE_DIAGRAMS.html]

### 4.4 Visit planning components

- `VisitCalendar` — schedule overview [page:FUNCTIONAL_SPEC.html]
- `VisitPlanner` — itinerary/planning panel [page:SEQUENCE_DIAGRAMS.html]
- `CriteriaGatePanel` — budget/size/area/license/timeline check before confirm [page:SEQUENCE_DIAGRAMS.html]
- `VisitLocationCard` — planned stop with details [page:FUNCTIONAL_SPEC.html]
- `VisitOutcomeForm` — visit results / notes [page:FUNCTIONAL_SPEC.html]
- `LandlordCoordinationPanel` — landlord contact/confirmation area [page:FUNCTIONAL_SPEC.html]

### 4.5 Negotiation & deal components

- `NegotiationCaseTable` — negotiation list [page:FUNCTIONAL_SPEC.html]
- `NegotiationHeader` — lead/listing/client context [page:FUNCTIONAL_SPEC.html]
- `OfferCard` — offer terms snapshot [page:FUNCTIONAL_SPEC.html]
- `OfferHistoryTimeline` — chronological sequence of offers [page:FUNCTIONAL_SPEC.html]
- `CounterOfferForm` — create new round [page:FUNCTIONAL_SPEC.html]
- `DealSummaryPanel` — final terms + status [page:REQUIREMENTS_SPEC.html]
- `CommissionPanel` — commission calculations/records [page:REQUIREMENTS_SPEC.html]
- `CloseDealDialog` — confirm won/lost outcome [page:FUNCTIONAL_SPEC.html]

## 5. Inventory / listing management components

Inventory module ต้องใช้ component ที่ต่างจาก public listing components แม้จะเกี่ยวกับ object ชนิดเดียวกัน เพราะหน้าที่คือจัดการข้อมูลและ publishability ไม่ใช่การขายตรง [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### 5.1 Property management components

- `PropertyTable` — index of physical assets [page:FUNCTIONAL_SPEC.html]
- `PropertyHeader` — core asset identity [page:FUNCTIONAL_SPEC.html]
- `TechnicalSpecsForm` — areas, floor load, height, power, etc. [page:REQUIREMENTS_SPEC.html]
- `LocationAdminPanel` — province/district/subdistrict/estate binding [page:REQUIREMENTS_SPEC.html]
- `OwnerInternalInfoPanel` — internal-only data [page:FUNCTIONAL_SPEC.html]

### 5.2 Listing management components

- `ListingTable` — listing index [page:REQUIREMENTS_SPEC.html]
- `ListingEditorForm` — transaction type, pricing, public data, publish state [page:FUNCTIONAL_SPEC.html]
- `AvailabilityEditor` — availability notes/check state [page:FUNCTIONAL_SPEC.html]
- `MapVisibilityControl` — exact/subdistrict/district/province [page:REQUIREMENTS_SPEC.html]
- `TranslationCompletenessPanel` — per-language status [page:FUNCTIONAL_SPEC.html]
- `PublishReadinessChecklist` — cover, translation, specs, SEO completion [page:FUNCTIONAL_SPEC.html]
- `PublishDialog` — final validation before publish [page:FLOWCHARTS.html][page:FUNCTIONAL_SPEC.html]
- `PriceHistoryPanel` — price audit/history [page:UML_CLASS_DIAGRAM.html]

### 5.3 Media components

- `MediaUploader` — image uploads [page:FUNCTIONAL_SPEC.html]
- `CoverImageSelector` — choose cover image [page:FUNCTIONAL_SPEC.html]
- `GallerySorter` — drag/sort media order [page:FUNCTIONAL_SPEC.html]
- `WatermarkControl` — watermark setting display/apply state [page:UML_CLASS_DIAGRAM.html][page:FUNCTIONAL_SPEC.html]
- `MediaPreviewLightbox` — admin preview [page:FUNCTIONAL_SPEC.html]

## 6. CMS / SEO / GEO components

สเปก v1.1 ยืนยันว่าระบบต้องมี content operations จริงจัง จึงต้องมี component family ที่รองรับ editorial workflows, localization และ search intelligence [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### 6.1 Editorial components

- `ContentTable` — pages/articles/FAQ index [page:FUNCTIONAL_SPEC.html]
- `ContentEditorHeader` — title, status, slug, publish actions [page:FUNCTIONAL_SPEC.html]
- `RichTextEditor` — article/body content [page:FUNCTIONAL_SPEC.html]
- `BlockEditor` — structured content sections [page:FUNCTIONAL_SPEC.html]
- `TranslationTabs` — th/en/zh editor tabs [page:REQUIREMENTS_SPEC.html]
- `TranslationStatusChip` — status by locale [page:FUNCTIONAL_SPEC.html]
- `SlugEditor` — localized slug/canonical controls [page:FUNCTIONAL_SPEC.html]

### 6.2 FAQ components

- `FaqTable` — FAQ index [page:REQUIREMENTS_SPEC.html]
- `FaqCategorySelector` — category management [page:FUNCTIONAL_SPEC.html]
- `FaqItemEditor` — question/answer editor [page:FUNCTIONAL_SPEC.html]
- `FaqSortControl` — ordering [page:FUNCTIONAL_SPEC.html]

### 6.3 SEO components

- `SeoPanel` — title, meta description, canonical, robots [page:FUNCTIONAL_SPEC.html]
- `HreflangPreview` — alternate-language link set preview [page:FUNCTIONAL_SPEC.html]
- `StructuredDataPreview` — JSON-LD preview by page type [page:FUNCTIONAL_SPEC.html]
- `SERPSnippetPreview` — search result preview [page:FUNCTIONAL_SPEC.html]
- `SchemaCompletenessCheck` — missing required SEO fields [page:FUNCTIONAL_SPEC.html]

### 6.4 GEO components

- `AreaPageBuilder` — hero, facts, FAQ, listing preview, map, links [page:REQUIREMENTS_SPEC.html]
- `ServicePageBuilder` — service-oriented structured layout [page:REQUIREMENTS_SPEC.html]
- `InternalLinkPlanner` — link graph for services/areas/articles [page:FUNCTIONAL_SPEC.html]
- `GeoQueryBinder` — bind area page to default listing query [page:FUNCTIONAL_SPEC.html]
- `LlmEntryManager` — llms.txt content/link management [page:REQUIREMENTS_SPEC.html]

## 7. Governance & audit components

บาง components ไม่มี owner เป็น sales หรือ content โดยตรง แต่มีหน้าที่ด้าน compliance, audit และ system governance [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

- `UserTable` — users list [page:REQUIREMENTS_SPEC.html]
- `RoleMatrix` — roles/permissions overview [page:FUNCTIONAL_SPEC.html]
- `AuditLogTable` — system audit trail [page:FUNCTIONAL_SPEC.html]
- `PermissionWarningBanner` — insufficient permission notice [page:FUNCTIONAL_SPEC.html]
- `DangerZonePanel` — sensitive settings/actions [page:FUNCTIONAL_SPEC.html]

## 8. Cross-cutting states every component family should support

เพื่อให้ inventory นี้ใช้เป็น implementation guide ได้จริง ต้องระบุด้วยว่า component หลายตัวต้องรองรับ states เหล่านี้ [page:FUNCTIONAL_SPEC.html]:

- loading
- empty
- success
- validation error
- server error
- disabled
- permission-restricted
- draft
- published
- archived

ในระบบนี้ state handling สำคัญมาก เพราะหลาย module เกี่ยวข้องกับ publishability, workflow transitions และ role permissions [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## 9. Component dependency map

Component inventory นี้ไม่ได้หมายความว่าทุกอย่างเป็น independent component [code_file:540].  ควรตีความความสัมพันธ์ในระดับกว้างดังนี้:

- Foundational primitives → ใช้ compose public/admin/CMS components [page:FUNCTIONAL_SPEC.html]
- Listing components → feed both public detail/search and shortlist builder [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html]
- Lead/requirement components → feed CRM surfaces [page:REQUIREMENTS_SPEC.html]
- SEO/CMS components → feed public page rendering and AI/GEO outputs [page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html]
- Governance components → control visibility/actions across admin modules [page:REQUIREMENTS_SPEC.html]

## 10. What changed from the previous inventory

เทียบกับ inventory เดิม การเปลี่ยนแปลงสำคัญมีดังนี้ [code_file:518][code_file:540]:

- เดิม inventory เน้น public marketing/discovery components แต่ฉบับนี้เพิ่ม admin + CRM + CMS/SEO + governance families [code_file:540]
- เดิมยังไม่แยก listing detail/search components ออกจาก listing management components ชัดเจน แต่ฉบับนี้แยก public-vs-admin ตามบทบาท [page:FUNCTIONAL_SPEC.html]
- เดิมไม่มี module-level components สำหรับ shortlist, visit, negotiation, deal แต่ฉบับนี้ใส่ครบตาม flow A–E [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html]
- เดิมไม่มี editorial/localization/schema components ชัดเจน แต่ฉบับนี้เพิ่ม translation tabs, SEO panels, llms manager และ GEO builders [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]

## สรุป

`11_component_inventory.md` เวอร์ชันนี้ไม่ใช่แค่รายการ UI blocks แต่เป็น **component map ของแพลตฟอร์มทั้งระบบ** ที่ผูกกับ business objects, workflows, actor roles และ public/admin/content responsibilities อย่างชัดเจน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html][code_file:540].

เอกสารนี้ควรถูกใช้เป็นฐานสำหรับการแยก component boundaries, ตั้งชื่อ component ใน design system/codebase, วาง reusable patterns และกำหนดขอบเขต QA ให้สอดคล้องกับสเปก v1.1 ของโปรเจกต์ [page:FUNCTIONAL_SPEC.html][code_file:540].
