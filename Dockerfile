# Base on official Postgres image
FROM postgres:15

# Install Node.js (18.x) and Caddy
RUN apt-get update \
    && apt-get install -y curl gnupg lsb-release ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs caddy \
    && rm -rf /var/lib/apt/lists/*

# Set Postgres defaults via environment
ENV POSTGRES_USER=orderdb \
    POSTGRES_PASSWORD=3e8f79ccABC- \
    POSTGRES_DB=orderdb

# Create app directory
WORKDIR /app

# Copy and build backend
COPY drizzle/ ./drizzle
COPY server/ ./server
RUN cd server && npm install && npm run build && npm prune --production

# Copy and build frontend
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm run build

# Copy Caddy configuration
COPY assets/Caddyfile /etc/caddy/Caddyfile

# Expose ports
EXPOSE 5432 4000 80 443

# Entrypoint: start Postgres, migrations, backend, and Caddy
CMD pg_ctl -D "$PGDATA" -o "-c listen_addresses='*'" start && \
    cd /app/server && \
    NEON_DB_URL="postgresql://orderdb:3e8f79ccABC-@localhost:5432/orderdb" npm run start & \
    caddy run --config /etc/caddy/Caddyfile --adapter caddyfile