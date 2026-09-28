FROM ghcr.io/flaresolverr/flaresolverr:latest

ARG NODE_VERSION=22.20.0

USER root

RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
      | tar -xz -C /usr/local --strip-components=1 --no-same-owner && \
    node --version && npm --version

ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    CHROMIUM_PATH=/usr/bin/chromium \
    DATA_DIR=/data \
    LISTEN=0.0.0.0:8788

WORKDIR /opt/statsig-signer

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY src ./src

RUN mkdir -p /data && chown -R flaresolverr:flaresolverr /data /opt/statsig-signer
USER flaresolverr
VOLUME ["/data"]
EXPOSE 8788

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8788/readyz').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
