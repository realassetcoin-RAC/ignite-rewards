# Referral Settlement System Documentation

## Overview

The RAC Rewards platform includes an automated referral settlement system that processes referral rewards based on specific completion criteria. This system ensures that referrers are rewarded when their referred users meet certain milestones.

## Settlement Criteria

### Primary Criteria for Referral Settlement

1. **User Account Verification**
   - The referred user must have a verified email address
   - Account must be in good standing (not suspended or banned)

2. **First Transaction Completion**
   - The referred user must complete at least one successful transaction
   - Transaction must have a positive amount
   - Transaction status must be 'completed'

3. **Profile Completion**
   - The referred user must have completed their profile
   - Full name must be provided and not empty

4. **Active Campaign**
   - There must be an active referral campaign
   - Current date must be within the campaign's start and end dates

### Settlement Process Flow

```
1. User A refers User B using a referral code
2. User B signs up and completes their profile
3. User B verifies their email address
4. User B completes their first transaction
5. System automatically detects completion criteria
6. Referral status changes from 'pending' to 'completed'
7. Points are awarded to User A (referrer)
8. Referral status changes to 'rewarded'
```

## Database Schema

### Core Tables

#### `user_referrals`
- `id`: Unique identifier
- `referrer_id`: ID of the user who made the referral
- `referral_code`: Unique referral code used
- `referred_email`: Email of the referred user
- `referred_user_id`: ID of the referred user (after signup)
- `merchant_id`: Associated merchant (if applicable)
- `campaign_id`: Associated referral campaign
- `status`: Current status ('pending', 'completed', 'rewarded')
- `reward_points`: Points to be awarded
- `completed_at`: When completion criteria were met
- `rewarded_at`: When points were actually awarded
- `created_at`: When referral was created
- `updated_at`: Last update timestamp

#### `referral_campaigns`
- `id`: Unique identifier
- `name`: Campaign name
- `description`: Campaign description
- `reward_points`: Points awarded per successful referral
- `start_date`: Campaign start date
- `end_date`: Campaign end date
- `is_active`: Whether campaign is currently active
- `created_at`: Creation timestamp

#### `user_points`
- `id`: Unique identifier
- `user_id`: ID of the user receiving points
- `points`: Number of points awarded
- `point_type`: Type of points ('referral', 'transaction', etc.)
- `source`: Source of the points ('referral_settlement', 'referral_auto_settlement')
- `source_id`: ID of the referral that generated the points
- `description`: Human-readable description
- `created_at`: When points were awarded

## Automated Functions

### `process_referral_settlements()`

**Purpose**: Manually process all pending referrals that meet settlement criteria

**Returns**: 
- `processed_count`: Number of referrals processed
- `total_rewards_awarded`: Total points awarded
- `settlement_summary`: Summary of the settlement process

**Usage**:
```sql
SELECT * FROM public.process_referral_settlements();
```

### `check_referral_completion_criteria(user_id)`

**Purpose**: Check if a specific user meets all referral completion criteria

**Parameters**:
- `user_id`: UUID of the user to check

**Returns**: Boolean indicating whether criteria are met

**Usage**:
```sql
SELECT public.check_referral_completion_criteria('user-uuid-here');
```

### `auto_process_referral_on_completion()`

**Purpose**: Trigger function that automatically processes referrals when transaction completion is detected

**Trigger**: Fired on INSERT or UPDATE of `loyalty_transactions` table

**Behavior**:
1. Checks if transaction status changed to 'completed'
2. Finds pending referrals for the user
3. Verifies completion criteria
4. Awards points to referrer
5. Updates referral status

### `scheduled_referral_settlement()`

**Purpose**: Scheduled function for daily processing of missed settlements

**Usage**: Typically called by a cron job or scheduled task

## Monitoring and Reporting

### Referral Settlement Status View

The `referral_settlement_status` view provides real-time monitoring of all referrals:

```sql
SELECT * FROM public.referral_settlement_status;
```

**Columns**:
- `id`: Referral ID
- `referrer_id`: ID of referrer
- `referred_user_id`: ID of referred user
- `status`: Current referral status
- `reward_points`: Points to be awarded
- `campaign_name`: Name of associated campaign
- `settlement_status`: Human-readable settlement status

**Settlement Status Values**:
- `Ready for Settlement`: Criteria met, ready to process
- `Pending Completion`: Waiting for user to meet criteria
- `Completed - Ready for Reward`: Completed but not yet rewarded
- `Settled`: Fully processed and rewarded

## Manual Settlement Process

### For Administrators

1. **Check Settlement Status**:
   ```sql
   SELECT * FROM public.referral_settlement_status 
   WHERE settlement_status = 'Ready for Settlement';
   ```

2. **Process Settlements**:
   ```sql
   SELECT * FROM public.process_referral_settlements();
   ```

3. **Monitor Results**:
   ```sql
   SELECT * FROM public.referral_settlement_status 
   WHERE status = 'rewarded' 
   ORDER BY rewarded_at DESC 
   LIMIT 10;
   ```

### For Developers

1. **Test Completion Criteria**:
   ```sql
   SELECT 
       id,
       referred_user_id,
       public.check_referral_completion_criteria(referred_user_id) as meets_criteria
   FROM public.user_referrals 
   WHERE status = 'pending';
   ```

2. **View Settlement Logs**:
   ```sql
   SELECT * FROM public.system_logs 
   WHERE log_message LIKE '%referral settlement%' 
   ORDER BY created_at DESC;
   ```

## Configuration

### Campaign Settings

Referral campaigns can be configured with the following parameters:

- **Reward Points**: Number of points awarded per successful referral
- **Start/End Dates**: Campaign duration
- **Active Status**: Whether the campaign is currently running

### Settlement Timing

- **Automatic**: Settlements are processed immediately when completion criteria are met
- **Scheduled**: Daily batch processing for any missed settlements
- **Manual**: Administrators can trigger settlements manually

## Error Handling

### Common Issues

1. **No Active Campaign**: Settlement will not proceed if no active campaign exists
2. **Missing User Data**: Referrals for deleted users are handled gracefully
3. **Duplicate Processing**: System prevents duplicate point awards
4. **Database Constraints**: RLS policies ensure data integrity

### Troubleshooting

1. **Check Campaign Status**:
   ```sql
   SELECT * FROM public.referral_campaigns WHERE is_active = true;
   ```

2. **Verify User Completion**:
   ```sql
   SELECT public.check_referral_completion_criteria('user-id');
   ```

3. **Review Settlement Logs**:
   ```sql
   SELECT * FROM public.system_logs 
   WHERE log_level = 'ERROR' 
   AND log_message LIKE '%referral%';
   ```

## Security Considerations

### Row Level Security (RLS)

- Users can only view their own referrals
- Administrators have full access to all referral data
- Settlement functions run with elevated privileges

### Data Privacy

- Referral codes are unique and non-guessable
- User data is protected by RLS policies
- Settlement logs do not contain sensitive information

## Performance Optimization

### Indexes

The system includes optimized indexes for:
- Referral status queries
- User completion checks
- Settlement processing

### Batch Processing

- Daily scheduled settlements handle bulk processing
- Individual settlements are processed immediately
- Database triggers minimize processing overhead

## Future Enhancements

### Planned Features

1. **Multi-tier Referrals**: Support for secondary and tertiary referrals
2. **Dynamic Reward Calculation**: Variable rewards based on user activity
3. **Referral Analytics**: Detailed reporting and analytics dashboard
4. **A/B Testing**: Campaign optimization through testing
5. **Integration APIs**: External system integration capabilities

### Scalability Considerations

- Database partitioning for large referral volumes
- Caching layer for frequently accessed data
- Queue-based processing for high-volume settlements
- Microservice architecture for settlement processing

## Support and Maintenance

### Regular Maintenance Tasks

1. **Monitor Settlement Performance**: Check daily settlement logs
2. **Review Campaign Effectiveness**: Analyze completion rates
3. **Update Settlement Criteria**: Adjust criteria based on business needs
4. **Database Optimization**: Regular index maintenance and query optimization

### Contact Information

For technical support or questions about the referral settlement system:
- Development Team: [Contact Information]
- Database Administrator: [Contact Information]
- Business Operations: [Contact Information]

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Document Owner: Development Team*
