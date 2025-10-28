# Points Migration OTP System

## Overview

The Points Migration OTP System allows users to migrate their points from third-party loyalty platforms to PointBridge using SMS OTP verification. This system ensures secure verification of user identity before processing points transfers.

## Architecture

### Components

1. **MigrationOTPService** (`src/lib/migrationOTPService.ts`)
   - Handles OTP sending and verification for migration
   - Manages migration context and status updates
   - Processes points transfer after verification

2. **PointsMigrationVerification** (`src/components/PointsMigrationVerification.tsx`)
   - React component for migration UI
   - Handles user input and OTP verification flow
   - Provides real-time feedback and countdown timers

3. **Database Schema** (`user_points_migrations` table)
   - Tracks migration requests and their status
   - Stores verification IDs and migration context
   - Maintains audit trail of all migrations

### Database Schema

```sql
CREATE TABLE user_points_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_phone VARCHAR(20) NOT NULL,
    source_platform VARCHAR(100) NOT NULL,
    source_platform_username VARCHAR(255),
    points_amount DECIMAL(15,2) NOT NULL CHECK (points_amount > 0),
    verification_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN (
        'pending_verification', 
        'verified', 
        'completed', 
        'failed'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage Flow

### 1. User Initiates Migration

```typescript
import { MigrationOTPService } from '@/lib/migrationOTPService';

const result = await MigrationOTPService.sendMigrationOTP(
  '+1234567890',           // userPhone
  'mig_123456789',         // migrationId
  'user-uuid',             // userId
  'Loyalty Program A',     // sourcePlatform
  1000.00                  // pointsAmount
);
```

### 2. User Verifies OTP

```typescript
const result = await MigrationOTPService.verifyMigrationOTP(
  'verification-id',       // verificationId
  '123456',               // otpCode
  'mig_123456789'         // migrationId
);
```

### 3. Process Migration

```typescript
const result = await MigrationOTPService.processPointsMigration(
  'mig_123456789'         // migrationId
);
```

## React Component Usage

```tsx
import { PointsMigrationVerification } from '@/components/PointsMigrationVerification';

<PointsMigrationVerification
  migrationId="mig_123456789"
  userPhone="+1234567890"
  sourcePlatform="Loyalty Program A"
  pointsAmount={1000}
  onVerificationComplete={(success, migrationContext) => {
    if (success) {
      console.log('Migration completed!');
    }
  }}
  onCancel={() => {
    console.log('Migration cancelled');
  }}
/>
```

## Testing

### Test Page

A test page is available at `test-points-migration.html` to test the complete migration flow:

1. Open `http://localhost:8084/test-points-migration.html`
2. Fill in the migration form
3. Test OTP sending and verification
4. Verify points are added to user account

### Test Data

The test page uses dummy data for testing:
- User ID: `test-user-id`
- Source platforms: Loyalty Program A, Rewards Club B, etc.
- Phone numbers: Any valid format with country code

## Security Features

### Rate Limiting
- OTP requests are limited per user
- Resend functionality has countdown timer
- Daily migration limits per user

### Validation
- Phone number format validation
- Points amount validation (must be positive)
- Migration status validation
- OTP code format validation (6 digits)

### Audit Trail
- All migration attempts are logged
- Status changes are tracked with timestamps
- Failure reasons are recorded
- User actions are timestamped

## Error Handling

### Common Errors

1. **Invalid Phone Number**
   - Error: "Phone number format invalid"
   - Solution: Ensure country code is included (+1, +44, etc.)

2. **OTP Verification Failed**
   - Error: "OTP verification failed"
   - Solution: Check code is 6 digits and not expired

3. **Migration Processing Failed**
   - Error: "Points migration processing failed"
   - Solution: Check user account and points balance

4. **Database Connection Issues**
   - Error: "Failed to store migration context"
   - Solution: Ensure PostgreSQL is running and accessible

## Configuration

### Environment Variables

```env
# Firebase Configuration (for OTP sending)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Database Configuration

The system uses the existing PostgreSQL database configuration:
- Host: `localhost`
- Port: `5432`
- Database: `ignite_rewards`
- User: `postgres`

## Monitoring

### Migration Status Tracking

```typescript
// Get user's migration history
const history = await MigrationOTPService.getUserMigrationHistory(userId);

// Check migration status
const migration = await MigrationOTPService.getMigrationContext(migrationId);
```

### Database Queries

```sql
-- Get all pending migrations
SELECT * FROM user_points_migrations WHERE status = 'pending_verification';

-- Get completed migrations for a user
SELECT * FROM user_points_migrations 
WHERE user_id = 'user-uuid' AND status = 'completed';

-- Get failed migrations
SELECT * FROM user_points_migrations 
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours';
```

## Troubleshooting

### Common Issues

1. **reCAPTCHA not loading**
   - Ensure `recaptcha-container` div exists in HTML
   - Check Firebase configuration

2. **SMS not received**
   - Verify Firebase Phone Auth is enabled
   - Check billing setup in Firebase Console
   - Ensure phone number format is correct

3. **Database errors**
   - Check PostgreSQL connection
   - Verify table exists and has correct schema
   - Check user permissions

4. **OTP verification fails**
   - Ensure code is entered within 5 minutes
   - Check verification ID is correct
   - Verify Firebase configuration

### Debug Mode

Enable debug logging by setting:
```typescript
console.log('Migration debug mode enabled');
```

This will log all migration steps and help identify issues.

## Future Enhancements

1. **Email Verification Option**
   - Add email as alternative to SMS
   - Send verification codes via email

2. **Bulk Migration Support**
   - Allow multiple platform migrations
   - Batch processing for efficiency

3. **Migration Scheduling**
   - Schedule migrations for specific times
   - Queue management system

4. **Advanced Analytics**
   - Migration success rates
   - User behavior tracking
   - Platform popularity metrics

## Support

For issues or questions regarding the Points Migration OTP System:

1. Check the troubleshooting section above
2. Review the test page for examples
3. Check database logs for errors
4. Verify Firebase configuration

The system is designed to be robust and user-friendly while maintaining security and data integrity throughout the migration process.
