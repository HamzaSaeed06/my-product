# SINGLE-TENANT ARCHITECTURE ALIGNMENT PLAN

**Created:** September 10, 2026  
**Status:** Documentation Phase  
**Target:** Align codebase to single-tenant architecture  
**Implementation:** NOT STARTED (awaiting approval)

---

## EXECUTIVE DECISION

**CONFIRMED:** Single-Tenant Customer Deployment is the ONLY target architecture.

**No production customers exist**, therefore:
- ❌ NO need to maintain multi-tenant mode
- ❌ NO need for dual-mode support
- ❌ NO migration of production customer data required
- ✅ Can remove multi-tenant code after dependency verification
- ✅ Can reset/migrate development/test data as needed

---

## TARGET ARCHITECTURE

### Single-Tenant Model

```
Each customer deployment:
├── Own domain (customer-owned)
├── Own hosting account (customer-owned)
├── Own database server (customer-owned)
├── Own application instance (provider-deployed)
├── Own license file (signed by provider)
└── Sends heartbeat to provider (async, passive)

Provider Platform:
├── Manages customers
├── Generates licenses
├── Tracks deployments
├── Monitors heartbeats
├── Manages support tickets
└── NO access to customer operational data
```

**Complete Isolation:**
- ✅ Separate domains
- ✅ Separate hosting
- ✅ Separate databases
- ✅ No shared resources
- ✅ Provider has NO customer database credentials

---

## CURRENT REPOSITORY STATE

### What EXISTS (Implemented)

#### Platform (Provider Control Panel)
✅ **Platform API** (`platform/api`)
- Organization/Customer management
- License generation (JWT-based)
- Plan management
- Deployment tracking
- Health check models
- Support ticketing
- Activity logging

✅ **Platform Web** (`platform/web`)
- Dashboard with stats
- Institute/Organization CRUD
- License management UI
- Analytics
- Audit logs
- Settings

✅ **Platform Database Schema**
- Organization (needs → Customer rename)
- License
- Plan
- Deployment
- HealthCheck
- SupportTicket
- ActivityLog

**Status:** ~95% compatible with single-tenant. Needs terminology updates and field adjustments.

---

#### Product (Customer Application)

✅ **Product API** (`product/api`)
- Complete Express.js application
- 30+ business modules:
  - Students, Staff, Guardians
  - Admissions, Enrollments
  - Attendance, Leave
  - Timetable, Assessments
  - Fees, Payments
  - Homework, Announcements
  - Complaints, Documents
  - Notifications
  - Reports
  - And more...

✅ **Product Database Schema**
- Comprehensive schema (50+ tables)
- School (needs → Institute rename)
- SchoolSettings
- User, Role, Permission, UserRole
- RefreshToken, PasswordResetToken
- Campus, AcademicYear, Term
- Class, Section, Subject
- Student, Guardian, Enrollment
- Staff, StaffAssignment
- Admission
- Attendance (Student + Staff)
- Timetable, PeriodSlot, Substitution
- Assessment, StudentGrade, GradeScale
- Exam, ExamTerm
- Homework, HomeworkSubmission
- FeeStructure, FeeInvoice, FeePayment, FeeCategory
- Discount, Leave, Announcement, Complaint
- Document, Notification, NotificationPreference
- Calendar, AuditLog

✅ **Product Web** (`product/web`)
- Next.js 14+ application
- Multiple portals (office, staff, parent, student)
- shadcn/ui components
- Responsive design

✅ **Authentication**
- JWT access + refresh tokens
- Password reset tokens
- User types (STUDENT, PARENT, STAFF)
- Role-based access control

✅ **Some Tests**
- `tests/admissions.test.ts` (placeholder)
- `tests/core_logic.test.ts`
- Vitest configured

**Status:** ~85% compatible. Core business logic reusable. Multi-tenant middleware needs removal.

---

### What CONFLICTS (Multi-Tenant Implementation)

❌ **Multi-Tenant Middleware** (`product/api/src/middleware/dynamicDB.ts`)
- Extracts subdomain from request
- Queries platform database for institute config
- Creates dynamic database connection per request
- Switches to institute-specific schema
- **CONFLICTS:** Single-tenant uses ONE fixed database

❌ **Platform DB Connection** (`product/api/src/config/platformDB.ts`)
- Establishes connection to platform database
- Used by dynamicDB middleware
- **CONFLICTS:** Customer app should NOT connect to provider database

❌ **Platform License Check** (`product/api/src/middleware/platformLicenseCheck.ts`)
- Queries platform database for license in real-time
- Checks license status on every API request
- Requires platform database connectivity
- **CONFLICTS:** License should be validated locally, not via provider database

❌ **Multi-Tenant Environment Variables** (`product/api/src/config/env.ts`)
```typescript
ENABLE_MULTI_TENANT: boolean
DEFAULT_SUBDOMAIN: string
PLATFORM_DB_HOST, PLATFORM_DB_PORT, PLATFORM_DB_NAME, PLATFORM_DB_USER, PLATFORM_DB_PASSWORD
```
- **CONFLICTS:** Not needed in single-tenant

❌ **Multi-Tenant Logic in app.ts**
```typescript
if (env.ENABLE_MULTI_TENANT) {
  app.use(dynamicDB);
  app.use(platformLicenseCheck);
} else {
  app.use(legacyLicenseCheck);
}
```
- **CONFLICTS:** Should only have single-tenant path

---

### What's MISSING (For Single-Tenant)

#### Missing Components:

1. ❌ **Local License Service** (`product/api/src/services/licenseService.ts`)
   - Load license from env var or file
   - Validate signature using embedded public key
   - Parse entitlements
   - Cache in memory
   - NO provider database access

2. ❌ **Heartbeat Service** (`product/api/src/services/heartbeatService.ts`)
   - Send async heartbeat to provider
   - Non-blocking, background job
   - Aggregated metrics only
   - Runs daily/weekly

3. ❌ **Local License Middleware** (`product/api/src/middleware/licenseMiddleware.ts`)
   - Check license expiry
   - Check feature entitlements
   - Check usage limits
   - Handle grace period
   - Pure local validation

4. ❌ **Embedded Public Key**
   - Provider's public key for signature verification
   - Embedded in application code or config

5. ❌ **Deployment Tooling**
   - Scripts for deploying to customer hosting
   - Database migration runner
   - Environment setup
   - Health check scripts

6. ❌ **InchargeScope Model** (from PRODUCT_SPEC)
   - Dynamic Incharge class/section scopes
   - Not yet implemented

7. ❌ **Approval Workflow System** (from PRODUCT_SPEC)
   - ApprovalRequest model
   - Approval routing
   - Not yet implemented

8. ❌ **Result Workflow States** (from PRODUCT_SPEC)
   - Draft → Submitted → Reviewed → Finalized → Published
   - StudentGrade has no status field

9. ❌ **Receipt as Separate Entity** (from PRODUCT_SPEC)
   - FeePayment exists, but no separate Receipt model

10. ❌ **Comprehensive Tests**
    - Only 2 placeholder tests exist
    - No integration tests
    - No E2E tests

---

## FILE-BY-FILE ANALYSIS

### Files to DELETE (Multi-Tenant Only)

| File | Reason | Dependencies to Check |
|------|--------|----------------------|
| `product/api/src/middleware/dynamicDB.ts` | Multi-tenant DB switching | app.ts imports it |
| `product/api/src/config/platformDB.ts` | Platform DB connection | dynamicDB.ts, platformLicenseCheck.ts use it |
| `product/api/src/middleware/platformLicenseCheck.ts` | Real-time platform license validation | app.ts imports it |

**Action:** Verify no other modules depend on these, then delete.

---

### Files to MODIFY (Remove Multi-Tenant Code)

| File | Current Issue | Required Changes |
|------|---------------|------------------|
| `product/api/src/config/env.ts` | Has multi-tenant env vars | Remove: ENABLE_MULTI_TENANT, DEFAULT_SUBDOMAIN, PLATFORM_DB_* |
| `product/api/src/app.ts` | Conditional multi-tenant logic | Remove: dynamicDB import/usage, platformLicenseCheck import/usage, multi-tenant conditional |
| `product/api/.env.example` | Multi-tenant variables | Remove platform DB variables |
| `product/api/.env` | Multi-tenant variables | Remove platform DB variables |

---

### Files to CREATE (New Single-Tenant Components)

| File | Purpose | Priority |
|------|---------|----------|
| `product/api/src/services/licenseService.ts` | Local license validation | 🔥 CRITICAL |
| `product/api/src/services/heartbeatService.ts` | Send heartbeat to provider | 🔥 HIGH |
| `product/api/src/middleware/licenseMiddleware.ts` | License check middleware | 🔥 CRITICAL |
| `product/api/src/config/publicKey.ts` | Embedded provider public key | 🔥 CRITICAL |
| `deploy/single-tenant-deploy.sh` | Deployment automation | 🔶 MEDIUM |
| `deploy/DEPLOYMENT_GUIDE.md` | Deployment documentation | 🔶 MEDIUM |

---

### Files to RENAME (Schema Changes)

| Current | Target | Reason | Complexity |
|---------|--------|--------|------------|
| `School` model | `Institute` | Generalization | 🔴 HIGH |
| `SchoolSettings` | `InstituteSettings` | Generalization | 🔴 HIGH |
| `schoolId` FK | `instituteId` | Consistency | 🔴 HIGH |

**Caution:** This affects:
- Database schema (50+ table references)
- TypeScript types
- API routes (`/api/v1/school` → `/api/v1/institute`)
- Frontend components
- Seed data
- Tests

**Recommendation:** Create migration plan with rollback strategy. Consider gradual rename.

---

### Files SAFE TO KEEP (No Changes Needed)

✅ **All Business Logic Modules** (`product/api/src/modules/*`)
- students, staff, admissions, attendance, fees, etc.
- 95%+ reusable as-is
- Only need School → Institute type updates

✅ **Frontend Application** (`product/web/*`)
- Entire Next.js app
- UI components
- Only needs School → Institute terminology updates

✅ **Database Schema Structure**
- All models remain valid
- Only naming changes needed (School → Institute)

✅ **Authentication System**
- JWT generation/validation
- RefreshToken mechanism
- PasswordReset flow
- User/Role/Permission models

✅ **Platform API & Web** (`platform/*`)
- Mostly compatible
- Only needs Organization → Customer rename
- Remove subdomain fields
- Add deployment URL fields

---

## DATABASE CHANGES REQUIRED

### Platform Database (Provider)

**Rename Model:**
```prisma
// Current:
model Organization { ... }

// Target:
model Customer { ... }
```

**Field Changes:**
```prisma
model Customer {
  // REMOVE these fields (multi-tenant):
  - domain String?                    // Subdomain on your platform
  
  // KEEP/RENAME:
  customDomain → deploymentUrl String // Customer's actual domain
  
  // ADD these fields:
  + hostingProvider String?           // "AWS" | "DigitalOcean" | "VPS" | "Shared"
}

model Deployment {
  // MODIFY:
  domain → deploymentUrl String       // Customer's domain, not subdomain
}
```

**Migration SQL:**
```sql
-- Rename table
ALTER TABLE organizations RENAME TO customers;

-- Rename fields
ALTER TABLE customers RENAME COLUMN domain TO legacy_domain;
ALTER TABLE customers RENAME COLUMN custom_domain TO deployment_url;
ALTER TABLE customers ADD COLUMN hosting_provider VARCHAR(64);

-- Update indexes
-- (add appropriate index updates)
```

---

### Product Database (Customer)

**Rename Model:**
```prisma
// Current:
model School { ... }
model SchoolSettings { ... }

// Target:
model Institute { ... }
model InstituteSettings { ... }
```

**Migration Strategy:**

**Option A: Direct Rename (Risky)**
```sql
ALTER TABLE schools RENAME TO institutes;
ALTER TABLE school_settings RENAME TO institute_settings;
-- Update all foreign keys...
```

**Option B: Gradual Migration (Safer)**
```sql
-- 1. Create new tables
CREATE TABLE institutes (LIKE schools INCLUDING ALL);
CREATE TABLE institute_settings (LIKE school_settings INCLUDING ALL);

-- 2. Copy data
INSERT INTO institutes SELECT * FROM schools;
INSERT INTO institute_settings SELECT * FROM school_settings;

-- 3. Update application to use new tables
-- 4. Verify
-- 5. Drop old tables (after confirmation)
```

**Option C: Alias/View (Temporary)**
```sql
-- Create views for backward compatibility during transition
CREATE VIEW schools AS SELECT * FROM institutes;
CREATE VIEW school_settings AS SELECT * FROM institute_settings;
```

**Recommendation:** Option B (Gradual) or Option C (Alias) for safety.

---

**Foreign Key Updates:**

Every table with `schoolId` needs update:
```sql
-- Example for students table:
ALTER TABLE students RENAME COLUMN school_id TO institute_id;
-- Repeat for 30+ tables
```

**Tables affected:**
- campuses, academic_years, classes, subjects
- students, guardians, staff
- enrollments, admissions, leaves
- homework, announcements, complaints, documents
- notifications, calendar_events, audit_log
- fee_structures, fee_categories, fee_invoices, fee_payments
- and more...

**TypeScript Type Updates:**

```typescript
// Update all occurrences:
School → Institute
SchoolSettings → InstituteSettings
schoolId → instituteId
```

Files affected: 100+ files across `product/api/src` and `product/web`.

---

## LICENSE ARCHITECTURE IMPLEMENTATION

### Current (Multi-Tenant)

```typescript
// On every API request:
1. Extract subdomain
2. Query platform_db for license
3. Check status, expiry, limits
4. Allow/deny request

Problem: Requires constant provider connectivity
```

### Target (Single-Tenant)

```typescript
// On app startup (once):
1. Load LICENSE_JWT from env variable
2. Verify signature using embedded public key
3. Parse entitlements
4. Cache in memory

// On API requests:
1. Check cached license (in-memory, fast)
2. Validate expiry
3. Check feature/limit
4. Allow/deny

// Background job (daily):
1. Send heartbeat to provider (async)
2. Update license if renewed
3. Non-blocking, no impact on app
```

### Implementation Tasks

**1. Create licenseService.ts:**
```typescript
import jwt from 'jsonwebtoken';
import fs from 'fs';

export class LicenseService {
  private license: ParsedLicense | null = null;
  private publicKey: string;

  constructor() {
    this.publicKey = fs.readFileSync('./config/public_key.pem', 'utf8');
    this.loadLicense();
  }

  private loadLicense() {
    const licenseJWT = process.env.LICENSE_JWT || fs.readFileSync('./license.jwt', 'utf8');
    
    try {
      const decoded = jwt.verify(licenseJWT, this.publicKey, {
        algorithms: ['RS256']
      });
      
      this.license = decoded as ParsedLicense;
      console.log('✅ License validated successfully');
    } catch (error) {
      console.error('❌ License validation failed:', error.message);
      throw new Error('Invalid license');
    }
  }

  isValid(): boolean {
    if (!this.license) return false;
    
    const now = Math.floor(Date.now() / 1000);
    
    // Check expiry
    if (this.license.exp < now) {
      // Check grace period (30 days)
      const gracePeriodEnd = this.license.exp + (30 * 24 * 60 * 60);
      if (now > gracePeriodEnd) {
        return false; // Grace period expired
      }
      // Within grace period: read-only mode
      return 'GRACE_PERIOD';
    }
    
    return true;
  }

  hasFeature(feature: string): boolean {
    return this.license?.features.includes(feature) || false;
  }

  getLimit(limitName: string): number {
    return this.license?.limits[limitName] || 0;
  }

  getExpiryDays(): number {
    if (!this.license) return 0;
    const now = Math.floor(Date.now() / 1000);
    const diff = this.license.exp - now;
    return Math.floor(diff / (24 * 60 * 60));
  }
}

export const licenseService = new LicenseService();
```

**2. Create licenseMiddleware.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { licenseService } from '../services/licenseService';

export function licenseMiddleware(req: Request, res: Response, next: Next Function) {
  const licenseStatus = licenseService.isValid();
  
  if (licenseStatus === false) {
    return res.status(403).json({
      error: 'LICENSE_EXPIRED',
      message: 'License has expired. Please contact provider to renew.',
    });
  }
  
  if (licenseStatus === 'GRACE_PERIOD') {
    // Read-only mode: Block write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return res.status(403).json({
        error: 'LICENSE_GRACE_PERIOD',
        message: 'License expired. Operating in read-only mode. Renew to restore full access.',
      });
    }
  }
  
  // Attach license info to request
  req.license = licenseService.getLicense();
  next();
}

export function requireFeature(feature: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!licenseService.hasFeature(feature)) {
      return res.status(403).json({
        error: 'FEATURE_NOT_AVAILABLE',
        message: `This feature requires '${feature}' in your license plan.`,
      });
    }
    next();
  };
}
```

**3. Create heartbeatService.ts:**
```typescript
import cron from 'node-cron';
import axios from 'axios';
import { licenseService } from './licenseService';
import { db } from '../db/client';

export class HeartbeatService {
  private providerUrl: string;

  constructor() {
    this.providerUrl = process.env.PROVIDER_API_URL || 'https://provider.yourcompany.com';
    this.scheduleHeartbeat();
  }

  private scheduleHeartbeat() {
    // Run daily at 3 AM
    cron.schedule('0 3 * * *', () => {
      this.sendHeartbeat();
    });
  }

  private async sendHeartbeat() {
    try {
      const metrics = await this.collectMetrics();
      
      const response = await axios.post(
        `${this.providerUrl}/api/v1/heartbeat`,
        {
          deploymentId: process.env.DEPLOYMENT_ID,
          licenseId: licenseService.getLicense().lic,
          version: process.env.APP_VERSION || '1.0.0',
          timestamp: new Date().toISOString(),
          metrics,
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );
      
      console.log('✅ Heartbeat sent successfully:', response.data);
      
      // If provider returns new license, update it
      if (response.data.newLicense) {
        this.updateLicense(response.data.newLicense);
      }
    } catch (error) {
      // Non-blocking: Just log the error
      console.warn('⚠️  Heartbeat failed (non-critical):', error.message);
    }
  }

  private async collectMetrics() {
    const studentCount = await db.student.count({ where: { status: 'active' } });
    const staffCount = await db.staff.count({ where: { status: 'active' } });
    const campusCount = await db.campus.count({ where: { isActive: true } });
    
    return {
      uptime: process.uptime(),
      studentCount,
      staffCount,
      campusCount,
      apiStatus: 'healthy',
      dbStatus: 'healthy',
    };
  }

  private updateLicense(newLicense: string) {
    // Save new license and reload
    // Implementation depends on deployment method
  }
}

export const heartbeatService = new HeartbeatService();
```

**4. Update app.ts:**
```typescript
// Remove:
- import { dynamicDB } from './middleware/dynamicDB.js';
- import { platformLicenseCheck } from './middleware/platformLicenseCheck.js';
- import { testPlatformDBConnection } from './config/platformDB.js';

// Add:
+ import { licenseMiddleware } from './middleware/licenseMiddleware.js';
+ import { licenseService } from './services/licenseService.js';
+ import { heartbeatService } from './services/heartbeatService.js';

// In createApp():
- Remove multi-tenant conditional
- Add single-tenant license middleware:

app.get('/api/v1/license/status', (req, res) => {
  res.json({
    valid: licenseService.isValid(),
    expiresIn: licenseService.getExpiryDays(),
    features: licenseService.getFeatures(),
  });
});

app.use(licenseMiddleware);
```

---

## PROVIDER PLATFORM CHANGES

### API Changes

**1. Rename Organization → Customer:**
```typescript
// platform/api/src/modules/organizations → customers
// Update all routes, controllers, services
```

**2. Add Heartbeat Endpoint:**
```typescript
// platform/api/src/modules/heartbeat/routes.ts
POST /api/v1/heartbeat

// Receives heartbeat from customer deployments
// Updates Deployment.lastHeartbeat
// Creates HeartbeatLog record
// Returns license status
```

**3. Remove Institute Provisioning Logic:**
```typescript
// Remove: Schema creation, multi-tenant DB setup
// Keep: License generation, customer creation
```

### Web UI Changes

**1. Terminology Updates:**
- Organization → Customer
- Institute → Deployment
- Subdomain → Deployment URL

**2. Remove Fields:**
- Subdomain input
- Schema name

**3. Add Fields:**
- Deployment URL (customer's domain)
- Hosting provider dropdown

**4. Update License Generation:**
- Show generated JWT
- Provide download button
- Show setup instructions

---

## DEPLOYMENT ARCHITECTURE

### Target Deployment Process

**Step 1: Customer Onboarding (Provider)**
```
1. Create customer record in provider platform
2. Generate signed license JWT
3. Provide customer with:
   - License JWT
   - Deployment instructions
   - Hosting requirements
```

**Step 2: Customer Preparation**
```
Customer provides:
- Domain name (abc-school.edu.pk)
- Hosting credentials (DigitalOcean, AWS, VPS)
- Database connection string
- Email for notifications
```

**Step 3: Deployment (Provider Service)**
```
#!/bin/bash
# deploy-customer.sh

# 1. Build application
npm run build

# 2. Package application (Docker or zip)
docker build -t customer-app:latest .

# 3. Upload to customer hosting
# (Via SSH, Docker registry, or hosting provider API)

# 4. Set environment variables:
DATABASE_URL=postgresql://...
LICENSE_JWT=eyJhbGc...
PROVIDER_API_URL=https://provider.yourcompany.com
DEPLOYMENT_ID=deploy_xyz123
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# 5. Run database migrations
npx prisma migrate deploy

# 6. Start application
docker run -d -p 80:4000 -p 443:4000 customer-app:latest

# 7. Configure domain/DNS
# 8. Setup SSL (Let's Encrypt)
# 9. Send test heartbeat
# 10. Notify customer
```

**Step 4: Verification**
```
1. Test customer can access: https://abc-school.edu.pk
2. Test login works
3. Test license validation
4. Test heartbeat received
5. Test basic operations
```

---

## SECURITY IMPLICATIONS

### Improvements (Single-Tenant)

✅ **Complete Data Isolation**
- Each customer has own database server
- No risk of cross-tenant data leakage
- No shared credentials

✅ **Customer Database Ownership**
- Customer controls database access
- Customer can audit database access logs
- Provider has NO database credentials

✅ **Offline License Validation**
- No provider connectivity required for operation
- Cryptographic signature prevents tampering
- Customer cannot be locked out by provider outage

✅ **Simplified Security Model**
- No subdomain routing vulnerabilities
- No schema-switching bugs
- No multi-tenant query complexity

### New Considerations

⚠️ **License Distribution**
- Must securely deliver LICENSE_JWT to customer
- Consider: Encrypted email, secure portal download, API delivery

⚠️ **Key Rotation**
- Public key embedded in app
- Need versioning strategy for key updates
- Old keys must be supported during transition

⚠️ **Clock Tampering**
- Customer could manipulate system clock
- Mitigation: Warn if clock drift > 1 hour from NTP
- Heartbeat validates actual time

⚠️ **License Revocation**
- Cannot immediately revoke (offline validation)
- Revocation takes effect on next heartbeat
- Grace period allows continued operation

⚠️ **Backup Access**
- If customer loses database access, you cannot help
- Recommend: Customer implements own backup strategy
- Consider: Encrypted backup service (optional)

---

## TESTING REQUIRED BEFORE IMPLEMENTATION

### Unit Tests (Required)

✅ **LicenseService**
- Load valid license → success
- Load invalid license → error
- Load expired license → handled
- Verify signature → correct
- Parse entitlements → correct

✅ **LicenseMiddleware**
- Valid license → allow
- Expired license (grace) → read-only
- Expired license (final) → block
- Feature check → correct

✅ **HeartbeatService**
- Collect metrics → correct
- Send heartbeat → success
- Provider unreachable → non-blocking

### Integration Tests (Required)

✅ **License Validation Flow**
- App startup → license loaded
- API request → license checked
- Feature request → entitlement verified

✅ **Grace Period Behavior**
- Expired + grace → read-only enforced
- POST request → blocked
- GET request → allowed
- Export → allowed

✅ **Heartbeat Flow**
- Heartbeat sent → provider receives
- Provider responds → app processes
- Provider down → app continues

### Manual Testing (Required)

✅ **Deployment Testing**
- Deploy to test VPS
- Deploy to DigitalOcean
- Deploy to AWS
- Deploy to shared hosting

✅ **License Scenarios**
- Valid license → full access
- Expiring soon → warning shown
- Expired (grace) → read-only
- Expired (final) → login restricted
- Invalid signature → app refuses to start
- Wrong public key → app refuses to start

✅ **Provider Connectivity**
- Provider online → heartbeat works
- Provider offline → app continues normally
- Provider returns error → app handles gracefully

---

## REMAINING ARCHITECTURAL DECISIONS

### Open Questions

**1. License File vs Environment Variable?**
- Option A: Environment variable only (simpler)
- Option B: File only (more portable)
- Option C: Both supported (most flexible)
- **Recommendation:** Option C

**2. Heartbeat Frequency?**
- Daily? (recommended)
- Every 12 hours?
- Weekly?
- Configurable?
- **Recommendation:** Daily, configurable via env var

**3. Grace Period Duration?**
- 7 days?
- 30 days? (recommended)
- 60 days?
- Configurable per customer?
- **Recommendation:** 30 days, configurable in license

**4. School → Institute Rename Timing?**
- Rename immediately (risky)?
- Rename gradually (safer)?
- Create aliases/views first (safest)?
- **Recommendation:** Create aliases, test, then rename

**5. Support Access Mechanism?**
- Never implement (strict isolation)?
- Time-limited token (future)?
- VPN + audit (future)?
- **Recommendation:** Decide later, not required now

**6. Deployment Automation Level?**
- Full automation (complex)?
- Semi-automated scripts (reasonable)?
- Manual with detailed docs (simple)?
- **Recommendation:** Start with scripts, automate incrementally

**7. Database Backup Strategy?**
- Customer responsibility only?
- Provider-managed backup service (optional)?
- Hybrid?
- **Recommendation:** Customer responsibility, provide guidance

---

## IMPLEMENTATION ORDER (Post-Approval)

### Phase 1: Create New Components (1 week)
```
✅ Priority: CRITICAL
1. Create licenseService.ts
2. Create licenseMiddleware.ts
3. Create heartbeatService.ts
4. Create publicKey.ts
5. Write unit tests
6. Test locally
```

### Phase 2: Remove Multi-Tenant Code (3 days)
```
✅ Priority: HIGH
1. Verify dependencies
2. Delete dynamicDB.ts
3. Delete platformDB.ts
4. Delete platformLicenseCheck.ts
5. Update app.ts
6. Update env.ts
7. Test application starts
```

### Phase 3: Provider Platform Updates (1 week)
```
✅ Priority: HIGH
1. Rename Organization → Customer
2. Update field names
3. Add heartbeat endpoint
4. Update Web UI
5. Test provider platform
```

### Phase 4: Documentation (3 days)
```
✅ Priority: HIGH
1. Update PRODUCT_SPEC.md (in progress)
2. Update BUILD_STATE.md (in progress)
3. Create DEPLOYMENT_GUIDE.md
4. Update README.md
5. Archive multi-tenant docs
```

### Phase 5: Database Rename (1 week)
```
⚠️ Priority: MEDIUM (can be deferred)
1. Plan School → Institute migration
2. Create migration scripts
3. Test on dev database
4. Create rollback procedure
5. Execute migration
6. Update TypeScript types
7. Update API routes
8. Update frontend
9. Test thoroughly
```

### Phase 6: Deployment Tooling (1 week)
```
✅ Priority: MEDIUM
1. Create deployment scripts
2. Test on various hosting platforms
3. Document deployment process
4. Create troubleshooting guide
```

### Phase 7: Testing & Validation (1 week)
```
✅ Priority: CRITICAL
1. Unit tests for new components
2. Integration tests
3. Manual testing all scenarios
4. Load testing
5. Security audit
```

**Total Estimated Time:** 4-6 weeks for complete alignment

---

## ROLLBACK STRATEGY

### If Issues Arise During Implementation

**Step 1: Preserve Multi-Tenant Code**
```
Create backup branch: backup/multi-tenant-20260910
Keep multi-tenant code in separate branch
Don't delete until single-tenant is verified working
```

**Step 2: Git Tags**
```
Tag current state: v1.0.0-multi-tenant
Tag each phase: v1.1.0-license-service, v1.2.0-cleanup, etc.
Can revert to any tag if needed
```

**Step 3: Database Migrations**
```
For each migration, create reverse migration
Test rollback before applying forward migration
Keep database backups before major changes
```

**Step 4: Environment Flags (Temporary)**
```
Keep ENABLE_MULTI_TENANT flag during transition
Allow toggling between modes during testing
Remove flag only after single-tenant fully verified
```

---

## SUCCESS CRITERIA

### Definition of "Alignment Complete"

✅ **Architecture:**
- [ ] Multi-tenant code removed
- [ ] Single-tenant license service working
- [ ] Heartbeat service working
- [ ] No platform DB connections from product
- [ ] Local license validation functional

✅ **Provider Platform:**
- [ ] Organization renamed to Customer
- [ ] Heartbeat endpoint functional
- [ ] License generation produces valid JWTs
- [ ] Web UI updated

✅ **Documentation:**
- [ ] PRODUCT_SPEC.md accurate
- [ ] BUILD_STATE.md accurate
- [ ] Deployment guide complete
- [ ] API documentation updated

✅ **Testing:**
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual deployment tested
- [ ] License scenarios tested
- [ ] Offline operation verified

✅ **Security:**
- [ ] License signature verification working
- [ ] No customer data in provider DB
- [ ] Cryptographic keys properly managed
- [ ] Grace period behavior correct

---

## FINAL RECOMMENDATION

**NEXT STEP:** 

1. ✅ **Review this ALIGNMENT_PLAN.md**
2. ✅ **Review updated PRODUCT_SPEC.md**
3. ✅ **Review updated BUILD_STATE.md**
4. ✅ **Approve or request changes**
5. ⏸️ **THEN start Phase 1 implementation**

**DO NOT start coding until documentation is approved.**

---

**Status:** ⏸️ **AWAITING APPROVAL**

**Date:** September 10, 2026  
**Next Review:** After user approval
