# TravelWeaver 2.0 - Linux Deployment Strategy

**Version**: 2.0
**Date**: 2025-12-31
**Status**: Design Phase
**Deployment Type**: Manual Linux Deployment (No Docker)

---

## Table of Contents

1. [Overview](#overview)
2. [Server Requirements](#server-requirements)
3. [Pre-Installation Setup](#pre-installation-setup)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Web Server Configuration](#web-server-configuration)
8. [SSL/TLS Certificates](#ssltls-certificates)
9. [Process Management](#process-management)
10. [Monitoring & Logging](#monitoring--logging)
11. [Backup Strategy](#backup-strategy)
12. [Updates & Maintenance](#updates--maintenance)

---

## Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Internet / Users                    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Nginx (Port 80/443)                │
│  - SSL Termination                              │
│  - Load Balancing                               │
│  - Static File Serving                          │
└────────┬───────────────────────┬────────────────┘
         │                       │
         │ /api/*                │ /*
         ▼                       ▼
┌──────────────────┐    ┌──────────────────────┐
│  FastAPI Backend │    │   Next.js Frontend   │
│  (Port 8000)     │    │   (Port 3000)        │
│  - Python 3.11+  │    │   - Node.js 18+      │
│  - Uvicorn       │    │   - React 18         │
│  - Gunicorn      │    │                      │
└──────┬───────────┘    └──────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│              Databases                        │
│  ┌────────────────┐    ┌─────────────────┐  │
│  │    MongoDB     │    │     SQLite      │  │
│  │  (Port 27017)  │    │   (File-based)  │  │
│  │  Dynamic Data  │    │  Reference Data │  │
│  └────────────────┘    └─────────────────┘  │
└──────────────────────────────────────────────┘
```

### Deployment Environment

- **OS**: Ubuntu 22.04 LTS or later
- **Python**: 3.11+
- **Node.js**: 18+
- **MongoDB**: 6.0+
- **Web Server**: Nginx
- **Process Manager**: systemd

---

## Server Requirements

### Minimum Requirements (Development/Small Production)

| Component | Specification |
|-----------|--------------|
| **CPU** | 2 vCPUs |
| **RAM** | 4 GB |
| **Storage** | 50 GB SSD |
| **OS** | Ubuntu 22.04 LTS |
| **Network** | 100 Mbps |

### Recommended Requirements (Production)

| Component | Specification |
|-----------|--------------|
| **CPU** | 4+ vCPUs |
| **RAM** | 8+ GB |
| **Storage** | 100+ GB SSD |
| **OS** | Ubuntu 22.04 LTS |
| **Network** | 1 Gbps |
| **Backup** | Separate backup storage |

### Software Stack

```bash
# Core
- Python 3.11+
- Node.js 18+
- MongoDB 6.0+
- Nginx 1.18+

# Python Packages
- FastAPI
- Uvicorn
- Gunicorn
- Pydantic
- pymongo
- anthropic
- python-jose
- bcrypt

# Node Packages
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
```

---

## Pre-Installation Setup

### 1. Update System

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y \
    build-essential \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    software-properties-common \
    apt-transport-https \
    ca-certificates
```

### 2. Create Application User

```bash
# Create dedicated user for application
sudo adduser --system --group --home /opt/travelweaver travelweaver

# Add user to necessary groups
sudo usermod -aG www-data travelweaver
```

### 3. Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MongoDB (local only - optional)
sudo ufw allow from 127.0.0.1 to any port 27017

# Check status
sudo ufw status
```

### 4. Install Python 3.11+

```bash
# Add deadsnakes PPA for latest Python
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.11
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip

# Set Python 3.11 as default
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Verify installation
python3 --version  # Should show Python 3.11.x
```

### 5. Install Node.js 18+

```bash
# Install Node.js from NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version   # Should show v18.x.x
npm --version    # Should show 9.x.x

# Install pnpm (optional but recommended)
npm install -g pnpm
```

---

## Database Setup

### MongoDB Installation

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Create MongoDB source list
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update and install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### MongoDB Configuration

```bash
# Edit MongoDB configuration
sudo vim /etc/mongod.conf
```

**Configuration** (`/etc/mongod.conf`):

```yaml
# Where to store data
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# Where to write logging data
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1  # Only local connections (secure)

# Security
security:
  authorization: enabled

# Replication (optional for production)
# replication:
#   replSetName: "rs0"
```

### Create MongoDB Admin User

```bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "your-strong-password-here",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

# Exit
exit
```

### Create TravelWeaver Database and User

```bash
# Connect as admin
mongosh -u admin -p

# Create database
use travelweaver

# Create application user
db.createUser({
  user: "travelweaver_app",
  pwd: "your-app-password-here",
  roles: [
    { role: "readWrite", db: "travelweaver" }
  ]
})

# Exit
exit
```

### Restart MongoDB

```bash
sudo systemctl restart mongod
```

### SQLite Setup

SQLite is file-based and requires no installation. The application will create the database file automatically.

```bash
# Create directory for SQLite database
sudo mkdir -p /opt/travelweaver/data
sudo chown travelweaver:travelweaver /opt/travelweaver/data

# Database will be created at /opt/travelweaver/data/reference.db
```

---

## Backend Deployment

### 1. Clone Repository

```bash
# Switch to application user
sudo su - travelweaver

# Clone repository
cd /opt/travelweaver
git clone https://github.com/yourusername/travelweaver-v2.git backend
cd backend
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### 3. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

**Create `requirements.txt`**:

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
gunicorn==21.2.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pymongo==4.6.1
anthropic==0.8.1
slowapi==0.1.9
python-dotenv==1.0.0
```

### 4. Configure Environment Variables

```bash
# Create .env file
vim /opt/travelweaver/backend/.env
```

**Environment Variables** (`.env`):

```bash
# Application
ENVIRONMENT=production
APP_NAME=TravelWeaver
APP_VERSION=2.0.0

# Server
HOST=0.0.0.0
PORT=8000

# Database - MongoDB
MONGODB_URL=mongodb://travelweaver_app:your-app-password-here@localhost:27017/travelweaver
MONGODB_DATABASE=travelweaver

# Database - SQLite
SQLITE_PATH=/opt/travelweaver/data/reference.db

# Security
JWT_SECRET_KEY=your-super-secret-key-min-32-chars-generate-with-secrets.token_urlsafe(32)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# API Keys
ANTHROPIC_API_KEY=your-anthropic-api-key
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret
AMADEUS_ENVIRONMENT=production

# CORS
CORS_ORIGINS=https://app.travelweaver.com,https://travelweaver.com

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/travelweaver/app.log
```

**Secure the .env file**:

```bash
chmod 600 /opt/travelweaver/backend/.env
```

### 5. Initialize Database

```bash
# Run database migrations/initialization
python app/scripts/init_db.py
```

**Create initialization script** (`app/scripts/init_db.py`):

```python
#!/usr/bin/env python3
"""
Initialize TravelWeaver databases
"""

import sqlite3
import pymongo
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

def init_mongodb():
    """Initialize MongoDB collections and indexes"""
    client = pymongo.MongoClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("MONGODB_DATABASE")]

    # Create collections with validators
    # Users collection
    db.create_collection("users")
    db.users.create_index("email", unique=True)
    db.users.create_index("organization_id")

    # Organizations collection
    db.create_collection("organizations")
    db.organizations.create_index("slug", unique=True)

    # Bookings collection
    db.create_collection("bookings")
    db.bookings.create_index("booking_code", unique=True)
    db.bookings.create_index("organization_id")
    db.bookings.create_index("traveler_id")
    db.bookings.create_index("status")

    # Conversations collection
    db.create_collection("conversations")
    db.conversations.create_index("organization_id")
    db.conversations.create_index("user_id")

    # Travelers collection
    db.create_collection("travelers")
    db.travelers.create_index([("organization_id", 1), ("email", 1)], unique=True)

    # Payments collection
    db.create_collection("payments")
    db.payments.create_index("booking_id")

    print("✓ MongoDB collections and indexes created")


def init_sqlite():
    """Initialize SQLite reference database"""
    db_path = os.getenv("SQLITE_PATH")
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Airports table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS airports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iata_code TEXT UNIQUE NOT NULL,
            icao_code TEXT,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            country TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            timezone TEXT
        )
    """)

    # Airlines table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS airlines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iata_code TEXT UNIQUE NOT NULL,
            icao_code TEXT,
            name TEXT NOT NULL,
            country TEXT,
            alliance TEXT,
            logo_url TEXT
        )
    """)

    # Countries table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS countries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            currency TEXT,
            phone_code TEXT,
            region TEXT
        )
    """)

    # Currencies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS currencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            symbol TEXT,
            exchange_rate REAL DEFAULT 1.0,
            updated_at TEXT
        )
    """)

    # Email templates table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            subject TEXT NOT NULL,
            html_content TEXT NOT NULL,
            text_content TEXT,
            variables TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)

    # Content table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT,
            status TEXT DEFAULT 'published',
            created_at TEXT,
            updated_at TEXT
        )
    """)

    conn.commit()
    conn.close()

    print("✓ SQLite tables created")


if __name__ == "__main__":
    print("Initializing TravelWeaver databases...")
    init_mongodb()
    init_sqlite()
    print("✓ Database initialization complete")
```

### 6. Test Backend

```bash
# Activate virtual environment
source /opt/travelweaver/backend/venv/bin/activate

# Run backend (test)
uvicorn app.api.main:app --host 0.0.0.0 --port 8000

# Test in another terminal
curl http://localhost:8000/api/v1/health

# Stop test server (Ctrl+C)
```

---

## Frontend Deployment

### 1. Clone/Navigate to Frontend

```bash
# Navigate to frontend directory
cd /opt/travelweaver
git clone https://github.com/yourusername/travelweaver-v2-frontend.git frontend
cd frontend
```

### 2. Install Dependencies

```bash
# Install Node packages
npm install
# OR
pnpm install
```

### 3. Configure Environment Variables

```bash
# Create .env.production
vim .env.production
```

**Environment Variables** (`.env.production`):

```bash
NEXT_PUBLIC_API_URL=https://api.travelweaver.com/api/v1
NEXT_PUBLIC_APP_URL=https://app.travelweaver.com
NEXT_PUBLIC_ENVIRONMENT=production
```

### 4. Build Frontend

```bash
# Build for production
npm run build
# OR
pnpm build

# Test build
npm run start
```

---

## Web Server Configuration

### Install Nginx

```bash
sudo apt install -y nginx
```

### Configure Nginx

**Create backend configuration** (`/etc/nginx/sites-available/travelweaver-backend`):

```nginx
# Backend API configuration
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.travelweaver.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.travelweaver.com;

    # SSL certificates (will be configured with Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.travelweaver.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.travelweaver.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/travelweaver-backend-access.log;
    error_log /var/log/nginx/travelweaver-backend-error.log;

    # Max upload size
    client_max_body_size 10M;

    # Proxy to backend
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Create frontend configuration** (`/etc/nginx/sites-available/travelweaver-frontend`):

```nginx
# Frontend application configuration
upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name app.travelweaver.com travelweaver.com www.travelweaver.com;

    # Redirect to HTTPS
    return 301 https://app.travelweaver.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.travelweaver.com travelweaver.com www.travelweaver.com;

    # Redirect www to non-www
    if ($host != "app.travelweaver.com") {
        return 301 https://app.travelweaver.com$request_uri;
    }

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/app.travelweaver.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.travelweaver.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/travelweaver-frontend-access.log;
    error_log /var/log/nginx/travelweaver-frontend-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Proxy to Next.js
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for Next.js HMR in dev)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://frontend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### Enable Sites

```bash
# Enable backend
sudo ln -s /etc/nginx/sites-available/travelweaver-backend /etc/nginx/sites-enabled/

# Enable frontend
sudo ln -s /etc/nginx/sites-available/travelweaver-frontend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## SSL/TLS Certificates

### Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain Certificates

```bash
# Get certificate for backend API
sudo certbot --nginx -d api.travelweaver.com

# Get certificate for frontend
sudo certbot --nginx -d app.travelweaver.com -d travelweaver.com -d www.travelweaver.com
```

### Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically creates a cron job for renewal
# Check: /etc/cron.d/certbot
```

---

## Process Management

### Backend systemd Service

**Create service file** (`/etc/systemd/system/travelweaver-backend.service`):

```ini
[Unit]
Description=TravelWeaver Backend API
After=network.target mongod.service

[Service]
Type=notify
User=travelweaver
Group=travelweaver
WorkingDirectory=/opt/travelweaver/backend
Environment="PATH=/opt/travelweaver/backend/venv/bin"
ExecStart=/opt/travelweaver/backend/venv/bin/gunicorn \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile /var/log/travelweaver/access.log \
    --error-logfile /var/log/travelweaver/error.log \
    --log-level info \
    app.api.main:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Frontend systemd Service

**Create service file** (`/etc/systemd/system/travelweaver-frontend.service`):

```ini
[Unit]
Description=TravelWeaver Frontend Application
After=network.target

[Service]
Type=simple
User=travelweaver
Group=travelweaver
WorkingDirectory=/opt/travelweaver/frontend
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm run start

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Create Log Directory

```bash
# Create log directory
sudo mkdir -p /var/log/travelweaver
sudo chown travelweaver:travelweaver /var/log/travelweaver
```

### Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable travelweaver-backend
sudo systemctl enable travelweaver-frontend

# Start services
sudo systemctl start travelweaver-backend
sudo systemctl start travelweaver-frontend

# Check status
sudo systemctl status travelweaver-backend
sudo systemctl status travelweaver-frontend

# View logs
sudo journalctl -u travelweaver-backend -f
sudo journalctl -u travelweaver-frontend -f
```

---

## Monitoring & Logging

### Application Logging

**Configure Python logging** (`app/core/logging_config.py`):

```python
import logging
import logging.handlers
import os

def setup_logging():
    """Setup application logging"""
    log_file = os.getenv("LOG_FILE", "/var/log/travelweaver/app.log")
    log_level = os.getenv("LOG_LEVEL", "INFO")

    # Create formatters
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor processes
htop

# Monitor disk I/O
sudo iotop

# Monitor network
sudo nethogs
```

### MongoDB Monitoring

```bash
# MongoDB stats
mongosh -u admin -p --eval "db.serverStatus()"

# Check replication status (if using replica set)
mongosh -u admin -p --eval "rs.status()"
```

### Log Rotation

**Configure logrotate** (`/etc/logrotate.d/travelweaver`):

```
/var/log/travelweaver/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 travelweaver travelweaver
    sharedscripts
    postrotate
        systemctl reload travelweaver-backend > /dev/null 2>&1 || true
    endscript
}
```

---

## Backup Strategy

### MongoDB Backup

**Create backup script** (`/opt/travelweaver/scripts/backup-mongo.sh`):

```bash
#!/bin/bash

# MongoDB backup script
BACKUP_DIR="/opt/travelweaver/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="travelweaver_${DATE}.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Run mongodump
mongodump \
    --uri="mongodb://travelweaver_app:your-app-password-here@localhost:27017/travelweaver" \
    --gzip \
    --archive="${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "travelweaver_*.gz" -mtime +7 -delete

echo "MongoDB backup completed: ${BACKUP_FILE}"
```

### SQLite Backup

**Create backup script** (`/opt/travelweaver/scripts/backup-sqlite.sh`):

```bash
#!/bin/bash

# SQLite backup script
SQLITE_DB="/opt/travelweaver/data/reference.db"
BACKUP_DIR="/opt/travelweaver/backups/sqlite"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="reference_${DATE}.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
sqlite3 $SQLITE_DB ".backup '${BACKUP_DIR}/${BACKUP_FILE}'"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "reference_*.db.gz" -mtime +7 -delete

echo "SQLite backup completed: ${BACKUP_FILE}.gz"
```

### Automate Backups with Cron

```bash
# Edit crontab
sudo crontab -e

# Add backup jobs (run daily at 2 AM)
0 2 * * * /opt/travelweaver/scripts/backup-mongo.sh >> /var/log/travelweaver/backup.log 2>&1
15 2 * * * /opt/travelweaver/scripts/backup-sqlite.sh >> /var/log/travelweaver/backup.log 2>&1
```

---

## Updates & Maintenance

### Update Backend

```bash
# Switch to application user
sudo su - travelweaver

# Navigate to backend
cd /opt/travelweaver/backend

# Pull latest changes
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Update dependencies
pip install --upgrade -r requirements.txt

# Run migrations (if any)
python app/scripts/migrate.py

# Exit application user
exit

# Restart backend service
sudo systemctl restart travelweaver-backend

# Check status
sudo systemctl status travelweaver-backend
```

### Update Frontend

```bash
# Switch to application user
sudo su - travelweaver

# Navigate to frontend
cd /opt/travelweaver/frontend

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Exit application user
exit

# Restart frontend service
sudo systemctl restart travelweaver-frontend

# Check status
sudo systemctl status travelweaver-frontend
```

### Zero-Downtime Deployment (Advanced)

For production with zero downtime:

1. **Use multiple backend instances** behind Nginx load balancer
2. **Rolling restart**: Restart instances one at a time
3. **Health checks**: Nginx only routes to healthy instances

---

**End of Deployment Strategy**

This comprehensive deployment guide covers all aspects of manually deploying TravelWeaver 2.0 on Linux servers without Docker.
