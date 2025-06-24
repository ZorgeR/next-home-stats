# Home Stats - Device Health Monitoring Dashboard

A modern, real-time device health monitoring dashboard built with Next.js. Track the status and uptime of all your devices from a single, beautiful interface.

![Dashboard Preview](./public/dashboard.jpg)

## ✨ Features

- **Real-time Monitoring**: Track device health status with automatic updates every 30 seconds
- **Device Management**: Monitor multiple devices across different locations
- **Visual Dashboard**: Clean, modern interface with charts and statistics
- **Uptime Tracking**: Calculate and display device uptime percentages
- **Timeline Visualization**: See device status changes over time
- **Location Grouping**: Organize devices by location (Office, Home, Data Center, etc.)
- **REST API**: Simple HTTP endpoint for devices to report their health
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Beautiful dark UI optimized for 24/7 monitoring

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (recommended: [Neon](https://neon.tech))
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd home-stats
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and configure your settings:

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database - Get from Neon or your PostgreSQL provider
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# Health monitoring timeout (5 minutes = 300000ms)
HEALTH_MAX_TIMEOUT=300000

# Optional API authentication
API_ACCESS_KEY="your-access-key"
API_ACCESS_TOKEN="your-access-token"
```

### 4. Set up the database

```bash
# Generate Prisma client and push schema to database
npm run setup
```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🎯 Usage

### Dashboard

Visit the main dashboard to see:
- **Overview stats**: Total devices, online/offline counts, average uptime
- **Device table**: Detailed view of all devices with their current status
- **Timeline charts**: Visual representation of device status over time
- **Location grouping**: Devices organized by their physical location

### Device Monitoring

Devices report their health by making HTTP GET requests to your dashboard's API endpoint:

```bash
curl "https://your-dashboard.vercel.app/api/v1/health/report?device_name=MyServer&location=Office&access_key=your_key&access_token=your_token"
```

### Setting Up Automated Monitoring

Create a script on your devices to send regular health reports:

```bash
#!/bin/bash
# save as health_report.sh

DEVICE_NAME="WebServer"
LOCATION="Office"
ACCESS_KEY="your_access_key"
ACCESS_TOKEN="your_access_token"
DASHBOARD_URL="https://your-dashboard.vercel.app"

curl -s "${DASHBOARD_URL}/api/v1/health/report?device_name=${DEVICE_NAME}&location=${LOCATION}&access_key=${ACCESS_KEY}&access_token=${ACCESS_TOKEN}"
```

Make it executable and add to crontab:

```bash
chmod +x health_report.sh

# Add to crontab to run every 5 minutes
crontab -e
# Add this line:
*/5 * * * * /path/to/health_report.sh
```

## 📡 API Documentation

### Health Report Endpoint

**Endpoint**: `GET /api/v1/health/report`

**Parameters**:
- `device_name` (required): Unique name for your device
- `location` (required): Physical location of the device
- `access_key` (required): API access key
- `access_token` (required): API access token

**Response**:
```json
{
  "success": true,
  "device": {
    "id": "clx1234567890",
    "name": "WebServer",
    "location": "Office"
  },
  "report": {
    "id": "clx0987654321",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Missing required parameters
- `401`: Invalid access credentials
- `500`: Internal server error

### Dashboard Data Endpoint

**Endpoint**: `GET /api/dashboard`

Returns comprehensive dashboard data including device statuses, timelines, and summary statistics.

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Vercel deployment setup
- Database configuration with Neon
- Environment variable configuration
- Production considerations

## 📊 Database Schema

The application uses two main tables:

- **Devices**: Store device information (name, location, access credentials)
- **Health Reports**: Store timestamped health check reports from devices

```sql
-- Devices table
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  access_key TEXT NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, location)
);

-- Health reports table
CREATE TABLE health_reports (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup` - Install dependencies and setup database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Create and apply migrations

## 🔍 Monitoring Multiple Devices

The dashboard can monitor unlimited devices. Each device is uniquely identified by the combination of `device_name` and `location`. Examples:

```bash
# Web server in office
curl "https://your-app.vercel.app/api/v1/health/report?device_name=WebServer&location=Office&access_key=key&access_token=token"

# Database server in data center
curl "https://your-app.vercel.app/api/v1/health/report?device_name=DatabaseServer&location=DataCenter&access_key=key&access_token=token"

# Raspberry Pi at home
curl "https://your-app.vercel.app/api/v1/health/report?device_name=RaspberryPi&location=Home&access_key=key&access_token=token"
```

## 🛡️ Security

- Optional API key authentication for health reports
- Environment variable-based configuration
- HTTPS-only in production
- Database connection security with SSL

## 📝 Configuration

Key configuration options in your `.env.local`:

- `HEALTH_MAX_TIMEOUT`: Time in milliseconds before a device is considered offline (default: 5 minutes)
- `API_ACCESS_KEY` & `API_ACCESS_TOKEN`: Optional authentication for the health endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**Database connection errors**:
- Verify `DATABASE_URL` is correctly formatted
- Ensure database is accessible from your deployment environment
- Check if the database exists and schema is applied

**API not receiving reports**:
- Verify API endpoint URL is correct
- Check access key and token match environment variables
- Review device-side curl commands for typos

**Dashboard not updating**:
- Check browser console for JavaScript errors
- Verify API endpoints are responding correctly
- Ensure devices are successfully sending health reports

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Review application logs in Vercel dashboard
3. Verify environment variables are set correctly
4. Test API endpoints with curl

---

Made with ❤️ for reliable device monitoring 