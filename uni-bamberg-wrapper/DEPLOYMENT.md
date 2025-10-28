# CORS Proxy Deployment Guide

## Option 1: Development (Local Testing)

```bash
# Install dependencies
pip3 install -r requirements.txt

# Run the proxy
python3 cors-proxy.py
```

The proxy will run on `http://localhost:5000`

## Option 2: Production (main.psi.uni-bamberg.de)

### Step 1: Upload files to server

```bash
# Upload the proxy script and requirements
scp cors-proxy.py requirements.txt user@main.psi.uni-bamberg.de:/path/to/proxy/
```

### Step 2: Install dependencies on server

```bash
ssh user@main.psi.uni-bamberg.de
cd /path/to/proxy/

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Run with Gunicorn

```bash
# Production run with 4 workers
gunicorn -w 4 -b 0.0.0.0:5000 cors-proxy:app
```

### Step 4: Setup as systemd service (optional)

Create `/etc/systemd/system/cors-proxy.service`:

```ini
[Unit]
Description=Uni-Bamberg CORS Proxy
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/proxy
Environment="PATH=/path/to/proxy/venv/bin"
ExecStart=/path/to/proxy/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 cors-proxy:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable cors-proxy
sudo systemctl start cors-proxy
```

### Step 5: Configure Nginx (if needed)

Add to your Nginx config:

```nginx
location /cors-proxy/ {
    proxy_pass http://localhost:5000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## Usage

After deployment, update the `PROXY_URL` in `script.js`:

```javascript
const PROXY_URL = 'https://main.psi.uni-bamberg.de/cors-proxy/fetch';
```

## Testing

Test the proxy:

```bash
curl "http://localhost:5000/fetch?url=https://www.uni-bamberg.de"
```

## Security Notes

- The proxy only allows uni-bamberg.de domains
- Rate limiting should be added for production use
- Consider adding authentication if needed
- Monitor logs for abuse
