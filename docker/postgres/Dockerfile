# Custom PostgreSQL Image for RAC Rewards Application
FROM postgres:15-alpine

# Set environment variables
ENV POSTGRES_DB=ignite_rewards
ENV POSTGRES_USER=dwarfintel
ENV POSTGRES_PASSWORD=Maegan@200328
ENV POSTGRES_INITDB_ARGS="--encoding=UTF-8 --lc-collate=C --lc-ctype=C"

# Install additional packages
RUN apk add --no-cache \
    curl \
    bash \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=UTC

# Create directories
RUN mkdir -p /docker-entrypoint-initdb.d \
    && mkdir -p /etc/postgresql \
    && mkdir -p /var/log/postgresql

# Copy initialization scripts
COPY init/ /docker-entrypoint-initdb.d/
COPY config/postgresql.conf /etc/postgresql/postgresql.conf

# Set proper permissions
RUN chmod -R 755 /docker-entrypoint-initdb.d \
    && chmod 644 /etc/postgresql/postgresql.conf

# Create custom entrypoint script
COPY docker-entrypoint-custom.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint-custom.sh

# Create health check script
COPY health-check.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/health-check.sh

# Expose PostgreSQL port
EXPOSE 5432

# Set custom entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint-custom.sh"]

# Default command
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/health-check.sh
