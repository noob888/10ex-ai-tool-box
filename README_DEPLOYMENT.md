# Quick Deployment Guide

## AWS Amplify Deployment

### 1. Push to Git
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy on Amplify
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "New app" → "Host web app"
3. Connect your Git repository
4. Add environment variables:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`
5. Click "Save and deploy"

### 3. Run Database Migrations
```bash
# Option 1: Run in Amplify build (configured in amplify.yml)
# Option 2: Run manually from AWS CloudShell or local machine
npm run db:migrate
npm run db:seed
```

### 4. Configure Domain
- App settings → Domain management
- Add custom domain: `tools.10ex.ai`

## Environment Variables Required

```
DATABASE_URL=your_db_url
GEMINI_API_KEY=your_api_key
NEXT_PUBLIC_SITE_URL=https://tools.10ex.ai
NODE_ENV=production
```

## Important Notes

1. **Database Access**: Ensure RDS security group allows connections from Amplify
2. **Migrations**: Run `npm run db:migrate` before first deployment
3. **Seeding**: Run `npm run db:seed` to populate initial data
4. **Health Check**: `/api/health` endpoint available for monitoring

For detailed instructions, see `DEPLOYMENT_AMPLIFY.md`

