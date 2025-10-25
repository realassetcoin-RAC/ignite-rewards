# Vercel UAT Deployment Guide

## 🚀 Deploying RAC Rewards UAT to Vercel

This guide will help you deploy the RAC Rewards application to Vercel for User Acceptance Testing (UAT).

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Ensure your code is pushed to GitHub
3. **Environment Variables**: Prepare production environment variables

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Environment Variables Setup

Set these environment variables in Vercel dashboard:

#### Supabase Configuration
```
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA
```

#### Database Configuration (UAT will use Supabase cloud)
```
VITE_DATABASE_URL=postgresql://postgres:Maegan@200328@localhost:5432/ignite_rewards
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=ignite_rewards
VITE_DB_USER=postgres
VITE_DB_PASSWORD=Maegan@200328
```

#### Application Configuration
```
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0-uat
VITE_APP_NAME=RAC Rewards UAT
VITE_API_BASE_URL=https://rac-rewards-uat.vercel.app/api
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
VITE_ENABLE_LOGGING=true
VITE_ENABLE_HTTPS=true
VITE_CORS_ORIGIN=https://rac-rewards-uat.vercel.app
```

### Step 3: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click "New Project"**
3. **Import Git Repository**: Connect your GitHub repository
4. **Configure Project**:
   - **Project Name**: `rac-rewards-uat`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (root)
   - **Build Command**: `bun run build`
   - **Output Directory**: `dist`
   - **Install Command**: `bun install`

### Step 4: Deploy via CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy from project root
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name: rac-rewards-uat
# - Directory: ./
# - Override settings? No
```

### Step 5: Configure Environment Variables in Vercel

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all the environment variables listed above
4. Set them for **Production** environment
5. Redeploy the project

### Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `uat.rac-rewards.com`)
3. Configure DNS records as instructed by Vercel

### Step 7: Verify Deployment

1. **Check Build Logs**: Ensure build completed successfully
2. **Test Application**: Visit the deployed URL
3. **Verify Features**:
   - ✅ Authentication works
   - ✅ Database connections work
   - ✅ Loyalty NFT cards display correctly
   - ✅ Admin dashboard functions
   - ✅ All API endpoints respond

### Step 8: UAT Testing Checklist

- [ ] **Authentication**: Login/logout functionality
- [ ] **User Registration**: New user signup
- [ ] **Loyalty Cards**: Display and management
- [ ] **NFT Management**: Create, edit, delete NFT types
- [ ] **Admin Dashboard**: All admin functions
- [ ] **Database Operations**: CRUD operations work
- [ ] **API Endpoints**: All APIs respond correctly
- [ ] **Mobile Responsiveness**: Works on mobile devices
- [ ] **Performance**: Page load times acceptable
- [ ] **Security**: HTTPS enabled, no console errors

### Troubleshooting

#### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

#### Runtime Errors
- Check browser console for errors
- Verify environment variables are correct
- Check Supabase connection

#### Database Issues
- Ensure Supabase project is active
- Verify RLS policies are configured
- Check database credentials

### Post-Deployment

1. **Monitor Performance**: Use Vercel Analytics
2. **Set up Alerts**: Configure error monitoring
3. **Backup Strategy**: Ensure database backups
4. **Documentation**: Update deployment docs

### Rollback Plan

If issues arise:
1. Go to Vercel dashboard
2. Navigate to **Deployments**
3. Click on previous successful deployment
4. Click **"Promote to Production"**

### Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vite Documentation**: [vitejs.dev](https://vitejs.dev)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)

---

## 🎯 UAT Deployment Complete!

Your RAC Rewards application is now deployed to Vercel for User Acceptance Testing. The URL will be:
`https://rac-rewards-uat.vercel.app`

Share this URL with your testing team and stakeholders for UAT validation.

