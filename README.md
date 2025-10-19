# Super MapScraper 🗺️

A production-grade, full-stack web application for scraping and aggregating business location data from Google Maps (and optionally Bing, Yelp, and OpenStreetMap) with no data limits and maximum coverage.

## 🎯 Features

- **Unlimited Data Extraction**: No artificial limits on search results
- **Multi-Provider Support**: Google Places, Bing Maps, Yelp, and OpenStreetMap
- **Advanced Search**: Grid-based area search for maximum coverage
- **Real-time Progress**: Live updates during search operations
- **Data Export**: CSV and JSON export capabilities
- **PWA Support**: Installable app with offline functionality
- **Analytics Dashboard**: Comprehensive usage and performance metrics
- **Modern Tech Stack**: Preact, Node.js, PostgreSQL with PostGIS, Redis
- **Production Ready**: Docker, Caddy reverse proxy, security headers

## 🏗️ Architecture

### Frontend
- **Framework**: Preact (lightweight React alternative)
- **Styling**: Goober (CSS-in-JS)
- **Build Tool**: Vite + Google Closure Compiler
- **PWA**: Service Worker, Web App Manifest
- **Maps**: Leaflet.js integration

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with PostGIS extension
- **Queue**: BullMQ with Redis
- **Logging**: Winston
- **Security**: Helmet, rate limiting, input validation

### Infrastructure
- **Web Server**: Caddy with HTTP/3 support
- **Containerization**: Docker + Docker Compose
- **Deployment**: Google Cloud Run ready
- **Security**: HSTS, CSP, security headers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Docker and Docker Compose
- PostgreSQL 13+ with PostGIS
- Redis 6+
- Google Places API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd maps-scrapper
cp env.example .env
```

### 2. Configure Environment

Edit `.env` file with your API keys and database credentials:

```bash
# Required API Keys
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
BING_MAPS_API_KEY=your_bing_maps_api_key_here
YELP_API_KEY=your_yelp_api_key_here

# Database
DB_PASSWORD=your_secure_password_here
```

### 3. Start with Docker Compose

```bash
# Development mode
docker-compose --profile dev up -d

# Production mode
docker-compose --profile prod up -d
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Optional: Seed with sample data
docker-compose exec backend npm run seed
```

### 5. Access the Application

- **Frontend**: http://localhost:5173 (dev) or http://localhost (prod)
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 🛠️ Development

### Local Development Setup

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Start development servers
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Building
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Testing
npm test                 # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with sample data
```

### Project Structure

```
maps-scrapper/
├── frontend/                 # Preact frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # Global styles
│   │   └── index.js        # Application entry point
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── workers/            # Background job workers
│   ├── config/             # Configuration files
│   ├── scripts/            # Database scripts
│   └── server.js           # Server entry point
├── public/                  # Static files for PWA
│   ├── manifest.json       # PWA manifest
│   ├── service-worker.js   # Service worker
│   └── icons/              # App icons
├── docker-compose.yml      # Docker services configuration
├── Dockerfile              # Multi-stage Docker build
├── Caddyfile              # Caddy reverse proxy config
└── README.md
```

## 🔧 Configuration

### API Keys Setup

1. **Google Places API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Places API
   - Create API key with Places API restrictions

2. **Bing Maps API** (Optional):
   - Go to [Bing Maps Portal](https://www.bingmapsportal.com/)
   - Create account and get API key

3. **Yelp API** (Optional):
   - Go to [Yelp Developers](https://www.yelp.com/developers/)
   - Create app and get API key

### Database Configuration

The application uses PostgreSQL with PostGIS extension for geospatial data:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Main tables are created automatically via migrations
```

### Redis Configuration

Redis is used for job queuing and caching:

```bash
# Default Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 🚀 Deployment

### Google Cloud Run Deployment

1. **Build and Push Image**:

```bash
# Build Docker image
docker build -t gcr.io/PROJECT_ID/super-mapscraper .

# Push to Google Container Registry
docker push gcr.io/PROJECT_ID/super-mapscraper
```

2. **Deploy to Cloud Run**:

```bash
gcloud run deploy super-mapscraper \
  --image gcr.io/PROJECT_ID/super-mapscraper \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="DB_HOST=your-cloud-sql-host" \
  --set-env-vars="REDIS_HOST=your-memorystore-host"
```

3. **Set up Cloud SQL and Memorystore**:

```bash
# Create Cloud SQL instance
gcloud sql instances create mapscraper-db \
  --database-version=POSTGRES_13 \
  --tier=db-f1-micro \
  --region=us-central1

# Create Memorystore instance
gcloud redis instances create mapscraper-redis \
  --size=1 \
  --region=us-central1
```

### Environment Variables for Production

```bash
NODE_ENV=production
DB_HOST=your-cloud-sql-host
DB_PASSWORD=your-secure-password
REDIS_HOST=your-memorystore-host
GOOGLE_PLACES_API_KEY=your-api-key
```

## 📊 Usage

### Basic Search

1. Navigate to the search page
2. Enter search queries (e.g., "restaurants in Nairobi")
3. Configure search radius and providers
4. Click "Start Search"
5. Monitor progress in real-time
6. View results in table and map
7. Export data as CSV or JSON

### Advanced Features

- **Grid Search**: Automatically performs dense area coverage
- **Deduplication**: Removes duplicate businesses based on location and contact info
- **Real-time Updates**: Live progress tracking during searches
- **Filtering**: Filter results by rating, location, contact info
- **Analytics**: View usage statistics and performance metrics

## 🔒 Security

### Security Headers

The application includes comprehensive security headers:

- **HSTS**: Forces HTTPS connections
- **CSP**: Content Security Policy to prevent XSS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing

### Rate Limiting

- API endpoints are rate-limited (100 requests per 15 minutes)
- Configurable rate limits per endpoint
- IP-based rate limiting

### Input Validation

- All inputs are validated and sanitized
- SQL injection prevention
- XSS protection

## 📈 Monitoring

### Health Checks

- Backend health endpoint: `/health`
- Database connectivity checks
- Redis connectivity checks
- Queue worker status

### Logging

- Structured JSON logging with Winston
- Log rotation and retention
- Error tracking and alerting

### Analytics

- Search performance metrics
- User activity tracking
- Export statistics
- Error rates and success rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting section

## 🔄 Changelog

### v1.0.0
- Initial release
- Google Places API integration
- Grid-based search functionality
- PWA support
- Export capabilities
- Analytics dashboard

---

**Super MapScraper** - Unlimited business data extraction with maximum coverage and performance.