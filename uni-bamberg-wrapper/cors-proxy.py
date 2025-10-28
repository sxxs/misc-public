#!/usr/bin/env python3
"""
Simple CORS Proxy for uni-bamberg.de wrapper
Deploy this on main.psi.uni-bamberg.de

Usage:
    python3 cors-proxy.py

Or with gunicorn for production:
    gunicorn -w 4 -b 0.0.0.0:5001 cors-proxy:app
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from urllib.parse import unquote

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Allowed domains to prevent abuse
ALLOWED_DOMAINS = [
    'uni-bamberg.de',
    'www.uni-bamberg.de'
]

@app.route('/fetch', methods=['GET'])
def fetch_url():
    """
    Fetch a URL and return its content
    Query parameter: url
    """
    target_url = request.args.get('url')

    if not target_url:
        return jsonify({
            'error': 'Missing url parameter'
        }), 400

    # Decode URL if encoded
    target_url = unquote(target_url)

    # Check if domain is allowed
    is_allowed = any(domain in target_url for domain in ALLOWED_DOMAINS)
    if not is_allowed:
        return jsonify({
            'error': 'Domain not allowed. Only uni-bamberg.de URLs are permitted.'
        }), 403

    try:
        # Fetch the content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
        }

        response = requests.get(target_url, headers=headers, timeout=30)
        response.raise_for_status()

        # Return the content
        return jsonify({
            'contents': response.text,
            'status': response.status_code,
            'url': target_url
        })

    except requests.exceptions.Timeout:
        return jsonify({
            'error': 'Request timeout'
        }), 504

    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': f'Failed to fetch: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'uni-bamberg CORS proxy'
    })

@app.route('/', methods=['GET'])
def index():
    """Index page with usage instructions"""
    return """
    <h1>Uni-Bamberg CORS Proxy</h1>
    <p>Usage: <code>/fetch?url=https://www.uni-bamberg.de/...</code></p>
    <p>Health check: <code>/health</code></p>
    <p>Allowed domains: uni-bamberg.de</p>
    """

if __name__ == '__main__':
    # Development server
    app.run(host='0.0.0.0', port=5001, debug=False)
