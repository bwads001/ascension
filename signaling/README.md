# Ascension Signaling Server

WebSocket-based signaling server for WebRTC peer connections.

## Protocol

All messages are JSON.

### Client → Server

```json
// Create a new room
{"type": "create_room", "playerName": "Alice"}

// Join existing room
{"type": "join_room", "roomId": "ABC123", "playerName": "Bob"}

// Leave room
{"type": "leave_room"}

// WebRTC signaling (relayed to other players)
{"type": "offer", "payload": {...}}
{"type": "answer", "payload": {...}, "playerId": "target-player-id"}
{"type": "ice_candidate", "payload": {...}}
```

### Server → Client

```json
// Room created successfully
{"type": "room_created", "roomId": "ABC123", "playerId": "uuid"}

// Joined room successfully
{"type": "room_joined", "roomId": "ABC123", "playerId": "uuid", "payload": [{"id": "...", "name": "Alice"}]}

// Another player joined
{"type": "player_joined", "playerId": "uuid", "playerName": "Bob"}

// A player left
{"type": "player_left", "playerId": "uuid"}

// Relayed WebRTC messages
{"type": "offer", "playerId": "sender-uuid", "payload": {...}}
{"type": "answer", "playerId": "sender-uuid", "payload": {...}}
{"type": "ice_candidate", "playerId": "sender-uuid", "payload": {...}}

// Error
{"type": "error", "error": "room not found"}
```

## Development

```bash
go mod tidy
go run .
# Server listens on :8080
```

## Deployment

### 1. Build

```bash
GOOS=linux GOARCH=amd64 go build -o signaling .
```

### 2. Deploy to VPS

```bash
# On your local machine
scp signaling user@your-vps:/tmp/
scp ascension-signaling.service user@your-vps:/tmp/
```

### 3. Install on VPS

```bash
# On VPS
sudo mkdir -p /opt/ascension-signaling
sudo mv /tmp/signaling /opt/ascension-signaling/
sudo chmod +x /opt/ascension-signaling/signaling

# Create user
sudo useradd -r -s /bin/false ascension
sudo chown -R ascension:ascension /opt/ascension-signaling

# Install systemd service
sudo mv /tmp/ascension-signaling.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ascension-signaling
sudo systemctl start ascension-signaling
```

### 4. Check Status

```bash
sudo systemctl status ascension-signaling
sudo journalctl -u ascension-signaling -f
```

### 5. Configure Firewall

```bash
# If using ufw
sudo ufw allow 8080/tcp

# If using iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

### 6. Configure Reverse Proxy (Optional)

For WSS (secure WebSocket) behind nginx:

```nginx
server {
    listen 443 ssl;
    server_name signaling.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Environment Variables

| Variable | Default | Description        |
| -------- | ------- | ------------------ |
| `PORT`   | `8080`  | Server listen port |

## Health Check

```bash
curl http://localhost:8080/health
# Returns: OK
```
