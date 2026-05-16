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

CMD python manage.py migrate --noinput && \
    gunicorn team_manager.wsgi:application --bind 0.0.0.0:${PORT:-8000}
