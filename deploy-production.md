# Production Deployment Guide

## 🚀 Complete Production Setup for Loyalty NFT System

This guide covers all the steps needed to deploy the complete loyalty NFT system to production.

## 📋 Prerequisites

### 1. Environment Setup
- Node.js 18+ 
- npm/yarn
- Supabase account
- Solana wallet (for smart contract deployment)

### 2. Required Environment Variables

Create a `.env.production` file with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Solana Configuration
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_NETWORK=mainnet-beta
VITE_PROGRAM_ID=your_program_id

# Application Configuration
VITE_APP_NAME=PointBridge
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# Security
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

## 🗄️ Database Setup

### 1. Apply Database Migrations

```bash
# Apply the loyalty NFT migration
node apply_loyalty_nft_migration.js

# Verify tables were created
psql -h your_db_host -U your_user -d your_db -c "\dt"
```

### 2. Initialize NFT Data

Run the SQL script to populate initial NFT types:

```sql
-- This is already included in loyalty_nft_migration.sql
-- Verify the data was inserted
SELECT * FROM nft_types ORDER BY is_custodial DESC, buy_price_usdt ASC;
```

### 3. Set up Row Level Security

The migration script already includes RLS policies, but verify they're active:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('nft_types', 'user_loyalty_cards', 'nft_evolution_history', 'nft_upgrade_history', 'nft_minting_control');
```

## 🔗 Smart Contract Deployment

### 1. Deploy Solana Contract

```bash
# Build the contract
anchor build

# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta

# Update the program ID in your environment variables
```

### 2. Initialize Contract

```bash
# Initialize the DAO config
solana program invoke --program-id YOUR_PROGRAM_ID \
  --accounts YOUR_ACCOUNTS \
  --instruction create_rac_mint

# Initialize rewards config
solana program invoke --program-id YOUR_PROGRAM_ID \
  --accounts YOUR_ACCOUNTS \
  --instruction initialize_rewards_config \
  --args 86400 1000000
```

## 🏗️ Frontend Deployment

### 1. Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Verify build
ls -la dist/
```

### 2. Deploy to Hosting Platform

#### Option A: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Option B: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

#### Option C: AWS S3 + CloudFront
```bash
# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 Production Configuration

### 1. Enable Production Features

Update your build configuration:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
        }
      }
    }
  },
  define: {
    __DEV__: false,
  }
});
```

### 2. Configure Error Monitoring

Add error tracking:

```typescript
// src/lib/errorTracking.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

### 3. Enable Analytics

```typescript
// src/lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';

export const analytics = new Analytics({
  mode: 'production'
});
```

## 🔒 Security Checklist

### 1. Database Security
- [ ] RLS policies are active
- [ ] Service role key is secure
- [ ] Database backups are configured
- [ ] Connection pooling is enabled

### 2. API Security
- [ ] Rate limiting is configured
- [ ] CORS is properly set
- [ ] Input validation is enabled
- [ ] SQL injection protection is active

### 3. Frontend Security
- [ ] HTTPS is enforced
- [ ] Content Security Policy is set
- [ ] XSS protection is enabled
- [ ] Environment variables are secure

## 📊 Monitoring Setup

### 1. Application Monitoring

```typescript
// src/lib/monitoring.ts
export const trackEvent = (event: string, properties?: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    analytics.track(event, properties);
  }
};
```

### 2. Database Monitoring

Set up alerts for:
- High query latency
- Connection pool exhaustion
- Failed queries
- Storage usage

### 3. Smart Contract Monitoring

Monitor:
- Transaction success rates
- Gas usage
- Contract interactions
- Error rates

## 🧪 Testing

### 1. Run Production Tests

```bash
# Run all tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### 2. Load Testing

```bash
# Test API endpoints
npm run test:load

# Test database performance
npm run test:db-performance
```

## 🚀 Go-Live Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] Database migrations applied
- [ ] Smart contract deployed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Monitoring configured

### Post-Deployment
- [ ] Health checks pass
- [ ] User registration works
- [ ] NFT purchase flow works
- [ ] Admin dashboard accessible
- [ ] Error tracking active
- [ ] Analytics collecting data

### User Acceptance Testing
- [ ] Test user registration
- [ ] Test NFT purchase (custodial)
- [ ] Test NFT purchase (non-custodial)
- [ ] Test NFT upgrade
- [ ] Test NFT evolution
- [ ] Test auto-staking
- [ ] Test admin functions

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_user_loyalty_cards_user_nft 
ON user_loyalty_cards(user_id, nft_type_id);

CREATE INDEX CONCURRENTLY idx_nft_types_active_custodial 
ON nft_types(is_active, is_custodial);
```

### 2. Frontend Optimization
- Enable code splitting
- Implement lazy loading
- Optimize images
- Use CDN for static assets

### 3. API Optimization
- Implement caching
- Use connection pooling
- Optimize queries
- Enable compression

## 🔄 Backup Strategy

### 1. Database Backups
```bash
# Daily automated backups
pg_dump -h your_host -U your_user your_db > backup_$(date +%Y%m%d).sql

# Store in secure location
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### 2. Smart Contract Backups
- Store contract source code
- Document deployment addresses
- Keep private keys secure
- Maintain upgrade procedures

## 📞 Support Setup

### 1. Error Reporting
- Configure Sentry for error tracking
- Set up alerts for critical errors
- Create runbooks for common issues

### 2. User Support
- Set up support ticket system
- Create FAQ documentation
- Train support team on NFT features

## 🎯 Success Metrics

Track these KPIs:
- User registration rate
- NFT purchase conversion
- User engagement metrics
- System uptime
- Error rates
- Transaction success rates

## 🔧 Maintenance

### Daily
- Monitor system health
- Check error logs
- Review user feedback

### Weekly
- Review performance metrics
- Update documentation
- Security updates

### Monthly
- Database maintenance
- Performance optimization
- Feature updates

---

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check connection string
   - Verify network access
   - Check connection pool settings

2. **Smart Contract Errors**
   - Verify program ID
   - Check account permissions
   - Review transaction logs

3. **Frontend Build Errors**
   - Check environment variables
   - Verify dependencies
   - Review build logs

### Emergency Procedures

1. **System Downtime**
   - Check monitoring dashboards
   - Review error logs
   - Contact hosting provider

2. **Data Issues**
   - Restore from backup
   - Check migration status
   - Verify RLS policies

3. **Security Incidents**
   - Isolate affected systems
   - Review access logs
   - Update security measures

---

**🎉 Congratulations! Your loyalty NFT system is now production-ready!**

For additional support, refer to the documentation or contact the development team.


