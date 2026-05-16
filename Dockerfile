FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1
ENV DEBUG=False

RUN python manage.py collectstatic --noinput
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
