# Deployment Guide

## Quick Start

### 1. Database Setup (Neon)

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new database project
3. Copy the connection string (it should look like: `postgresql://username:password@hostname:port/database?sslmode=require`)

### 2. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Set the following environment variables:

```
DATABASE_URL=your_neon_connection_string
HEALTH_MAX_TIMEOUT=300000
API_ACCESS_KEY=your_optional_access_key
API_ACCESS_TOKEN=your_optional_access_token
```

5. Deploy the project

### 3. Initialize Database

After deployment, you need to set up the database schema:

1. Install Vercel CLI: `npm i -g vercel`
2. Log in: `vercel login`
3. Link project: `vercel link`
4. Run database setup: `vercel env pull .env.local && npx prisma db push`

## Testing Your Deployment

### Test the API endpoint:

```bash
curl "https://your-vercel-app.vercel.app/api/v1/health/report?device_name=TestDevice&location=Home&access_key=test&access_token=test"
```

### View the dashboard:

Open `https://your-vercel-app.vercel.app` in your browser.

## Setting Up Device Monitoring

Create a script on your devices to send regular health reports:

```bash
#!/bin/bash
# save as health_report.sh

DEVICE_NAME="MyServer"
LOCATION="DataCenter1"
ACCESS_KEY="your_access_key"
ACCESS_TOKEN="your_access_token"
DASHBOARD_URL="https://your-vercel-app.vercel.app"

curl "${DASHBOARD_URL}/api/v1/health/report?device_name=${DEVICE_NAME}&location=${LOCATION}&access_key=${ACCESS_KEY}&access_token=${ACCESS_TOKEN}"
```

Add to crontab for regular reporting:
```bash
# Edit crontab
crontab -e

# Add line to run every 5 minutes
*/5 * * * * /path/to/health_report.sh
```

## Environment Variables Explained

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `HEALTH_MAX_TIMEOUT`: Time in milliseconds before a device is considered offline (default: 300000 = 5 minutes)
- `API_ACCESS_KEY` & `API_ACCESS_TOKEN`: Optional authentication for the health report endpoint

## Monitoring Multiple Devices

You can monitor multiple devices by:

1. Creating different health report scripts for each device
2. Using different `device_name` and `location` parameters
3. Setting up cron jobs on each device

Example for multiple devices:
```bash
# Device 1
curl "https://your-app.vercel.app/api/v1/health/report?device_name=WebServer&location=Office&access_key=key&access_token=token"

# Device 2  
curl "https://your-app.vercel.app/api/v1/health/report?device_name=DatabaseServer&location=DataCenter&access_key=key&access_token=token"
```

## Troubleshooting

### Database Issues
- Check if `DATABASE_URL` is correctly set in Vercel
- Ensure database is accessible from Vercel (Neon should work by default)
- Run `npx prisma db push` to update schema

### API Issues
- Check Vercel logs for errors
- Verify environment variables are set correctly
- Test API endpoint with curl

### Dashboard Issues
- Check browser console for JavaScript errors
- Verify API endpoints are working
- Check if data is being populated in database 