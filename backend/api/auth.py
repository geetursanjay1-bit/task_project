from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Accept email or username in the username field."""

    def validate(self, attrs):
        login = attrs.get('username', '').strip()
        password = attrs.get('password')

        user = authenticate(username=login, password=password)

        if user is None and '@' in login:
            for user_obj in User.objects.filter(email__iexact=login).order_by('-id'):
                user = authenticate(username=user_obj.username, password=password)
                if user:
                    break

        if user is None:
            for user_obj in User.objects.filter(username__iexact=login).order_by('-id'):
                user = authenticate(username=user_obj.username, password=password)
                if user:
                    break

        if user is None:
            raise serializers.ValidationError(
                {'detail': 'Invalid email/username or password.'}
            )

        refresh = self.get_token(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
