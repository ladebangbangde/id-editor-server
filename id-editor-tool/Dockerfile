FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash appuser \
  && mkdir -p /app/uploads /app/uploads/original /app/uploads/preview /app/uploads/hd /app/uploads/print /app/uploads/temp \
  && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["python", "-m", "http.server", "8000"]
