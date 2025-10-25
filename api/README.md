# City Search API Server

A dynamic, environment-aware API server that queries the PostgreSQL cities database with 323,573 cities.

## 🚀 Quick Start

### Development
```bash
# Start with development configuration
bun run api:dev

# Or start directly
bun run api:start
```

### Staging
```bash
bun run api:staging
```

### Production
```bash
bun run api:prod
```

## ⚙️ Configuration

The API server uses environment-specific configuration files:

- **Development**: `config.env` (default)
- **Staging**: `config.staging.env`
- **Production**: `config.production.env`

### Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `ignite_rewards` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `Maegan@200328` |
| `API_PORT` | API server port | `3001` |
| `API_HOST` | API server host | `localhost` |
| `CORS_ORIGIN` | CORS allowed origin | `*` |
| `DEFAULT_SEARCH_LIMIT` | Default search results | `10` |
| `MAX_SEARCH_LIMIT` | Maximum search results | `50` |
| `LOG_LEVEL` | Logging level | `info` |

## 🌍 Environment Variables

You can override any configuration using environment variables:

```bash
# Override database connection
export DB_HOST=your-db-host
export DB_PASSWORD=your-password

# Override API settings
export API_PORT=8080
export CORS_ORIGIN=https://your-domain.com

# Start the server
bun run api:start
```

## 📡 API Endpoints

### Search Cities
```
GET /api/cities/search?q=query&limit=10
```

**Parameters:**
- `q` (required): Search query (minimum 2 characters)
- `limit` (optional): Number of results (default: 10, max: 50)

**Example:**
```bash
curl "http://localhost:3001/api/cities/search?q=new%20york&limit=5"
```

### Get Statistics
```
GET /api/cities/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cities": "323573",
    "total_countries": "279",
    "major_cities": "0"
  }
}
```

### Health Check
```
GET /api/health
```

## 🔧 Frontend Integration

The frontend automatically detects the API server using environment variables:

```typescript
// In your .env.local or environment
VITE_API_BASE_URL=http://localhost:3001
VITE_API_PORT=3001
```

## 🐳 Docker Support

For containerized deployments, set environment variables:

```bash
docker run -e DB_HOST=your-db-host -e DB_PASSWORD=your-password your-api-image
```

## 📝 Logging

Log levels:
- `debug`: All logs
- `info`: Info and error logs (default)
- `error`: Error logs only

## 🔒 Security

- CORS is configurable per environment
- Database credentials are environment-specific
- No hardcoded secrets in code
- Input validation and sanitization

## 🚀 Deployment

### Development
```bash
bun run api:dev
```

### Staging
```bash
bun run api:staging
```

### Production
```bash
bun run api:prod
```

## 🛠️ Troubleshooting

### Database Connection Issues
1. Check database credentials in config file
2. Verify database server is running
3. Check network connectivity

### CORS Issues
1. Update `CORS_ORIGIN` in config file
2. Ensure frontend URL matches CORS origin

### Port Conflicts
1. Change `API_PORT` in config file
2. Update frontend `VITE_API_PORT` accordingly

## 📊 Performance

- **Database**: Direct PostgreSQL queries with optimized indexes
- **Caching**: Results are not cached (real-time data)
- **Limits**: Configurable result limits prevent large responses
- **Logging**: Minimal logging in production for performance
