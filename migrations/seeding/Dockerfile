FROM denoland/deno:2.2.10

WORKDIR /app

# Copy dependency specifications first for better caching
COPY deno.json .

# Copy source code
COPY *.ts ./

# Cache dependencies
RUN deno cache main.ts

# Default command
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
