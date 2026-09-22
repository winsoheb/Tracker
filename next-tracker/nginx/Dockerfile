FROM nginx:alpine

# Install openssl for cert generation
RUN apk add --no-cache openssl

# Generate a self-signed certificate for 192.168.1.176
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=192.168.1.176"

# Copy the custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
