# AWS Amplify Deployment Guide

## Prerequisites

1. **AWS Account** with Amplify access
2. **GitHub/GitLab/Bitbucket** repository with your code
3. **Database** (RDS PostgreSQL) accessible from AWS
4. **Domain** (optional) - tools.10ex.ai

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is pushed to GitHub/GitLab/Bitbucket:

```bash
git add .
git commit -m "Prepare for AWS Amplify deployment"
git push origin main
```

### 2. Create Amplify App

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Choose your Git provider (GitHub, GitLab, Bitbucket)
4. Authorize AWS to access your repository
5. Select your repository: `10ex-ai-tool-box`
6. Select branch: `main` (or your default branch)

### 3. Configure Build Settings

Amplify will auto-detect Next.js, but verify these settings:

**Build settings** (should auto-populate):
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

The `amplify.yml` file in your repo will be used automatically.

### 4. Add Environment Variables

In Amplify Console → App settings → Environment variables, add:

**Required Variables:**
```
DATABASE_URL=your_db_url
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SITE_URL=https://tools.10ex.ai
NODE_ENV=production
```

**Optional Variables:**
```
GOOGLE_VERIFICATION=your_google_verification_code
YANDEX_VERIFICATION=your_yandex_verification_code
```

### 5. Configure Database Access

**Important:** Your RDS database must be accessible from Amplify.

1. Go to RDS Console → Your database → Security groups
2. Edit inbound rules:
   - Type: PostgreSQL
   - Port: 5432
   - Source: `0.0.0.0/0` (or specific Amplify IP ranges)
   - Or: Add Amplify's VPC if using VPC peering

**Security Note:** For production, use VPC peering or restrict IP ranges.

### 6. Run Database Migrations

**Option A: Run migrations in Amplify build** (may fail if DB not accessible)
- Already configured in `amplify.yml` preBuild phase
- Will skip if it fails

**Option B: Run migrations manually** (Recommended for first deployment)
```bash
# SSH into a machine with DB access, or use AWS CloudShell
npm run db:migrate
npm run db:seed
```

### 7. Deploy

1. Click **"Save and deploy"** in Amplify Console
2. Wait for build to complete (5-10 minutes)
3. Your app will be live at: `https://<branch>.<app-id>.amplifyapp.com`

### 8. Configure Custom Domain (Optional)

1. Go to App settings → Domain management
2. Click **"Add domain"**
3. Enter: `tools.10ex.ai`
4. Follow DNS configuration steps
5. Update Route 53 records if using AWS DNS

### 9. Set Up Continuous Deployment

Amplify automatically:
- Deploys on every push to main branch
- Creates preview deployments for pull requests
- Runs build and test phases

## Post-Deployment Checklist

- [ ] Verify app is accessible
- [ ] Test database connection
- [ ] Verify API routes work (`/api/tools`, `/api/health`)
- [ ] Check SEO pages load correctly
- [ ] Test chat functionality (Gemini API)
- [ ] Verify environment variables are set
- [ ] Check logs for any errors
- [ ] Test on mobile devices
- [ ] Verify SSL certificate is active

## Monitoring & Logs

### View Logs
1. Amplify Console → Your app → Deployments
2. Click on a deployment → View logs
3. Check build logs, runtime logs

### Set Up Alerts
1. App settings → Notifications
2. Configure email/SMS alerts for:
   - Build failures
   - Deployment status

## Troubleshooting

### Build Fails
- Check build logs in Amplify Console
- Verify `package.json` scripts are correct
- Ensure all dependencies are in `package.json`

### Database Connection Issues
- Verify RDS security group allows Amplify IPs
- Check `DATABASE_URL` is correct
- Test connection from AWS CloudShell

### Environment Variables Not Working
- Ensure variables are set in Amplify Console
- Restart deployment after adding variables
- Check variable names match code (case-sensitive)

### 404 Errors on Routes
- Verify `amplify.yml` baseDirectory is `.next`
- Check Next.js routing configuration
- Ensure API routes are in `app/api/` directory

## Cost Estimation

**AWS Amplify Pricing:**
- Build minutes: $0.01 per build minute
- Hosting: $0.15 per GB served
- Data transfer: Included in hosting

**Estimated Monthly Cost:**
- Low traffic (< 10GB): ~$5-10/month
- Medium traffic (10-100GB): ~$20-50/month
- High traffic (100GB+): Pay-per-use

## Performance Optimization

1. **Enable Caching:**
   - Amplify automatically caches static assets
   - Configure cache headers in `next.config.js`

2. **CDN:**
   - Amplify uses CloudFront CDN automatically
   - Global edge locations for fast delivery

3. **Image Optimization:**
   - Next.js Image component is optimized
   - Consider using Amplify Image component

## Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use Amplify environment variables
   - Consider AWS Secrets Manager for sensitive data

2. **Database:**
   - Use VPC peering for database access
   - Restrict RDS security groups
   - Use SSL for database connections

3. **HTTPS:**
   - Amplify provides free SSL certificates
   - Automatically renews certificates

## Rollback

If deployment fails:
1. Go to Deployments tab
2. Find last successful deployment
3. Click **"Redeploy this version"**

## Next Steps

1. Set up monitoring (CloudWatch)
2. Configure custom domain
3. Set up CI/CD for automated testing
4. Configure preview deployments for PRs
5. Set up staging environment

## Support

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Next.js on Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [Amplify Console](https://console.aws.amazon.com/amplify)

