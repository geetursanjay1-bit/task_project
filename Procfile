web: cd backend && python manage.py migrate --noinput && gunicorn team_manager.wsgi:application --bind 0.0.0.0:$PORT
