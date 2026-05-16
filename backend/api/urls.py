from django.urls import path
from .views import (
    RegisterView,
    UserListView,
    ProjectListCreateView,
    ProjectDetailView,
    TaskListCreateView,
    TaskDetailView,
    TeamMemberListCreateView,
    TeamMemberDetailView
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('users/', UserListView.as_view()),

    path('projects/', ProjectListCreateView.as_view()),
    path('projects/<int:pk>/', ProjectDetailView.as_view()),

    path('tasks/', TaskListCreateView.as_view()),
    path('tasks/<int:pk>/', TaskDetailView.as_view()),

    path('team-members/', TeamMemberListCreateView.as_view()),
    path('team-members/<int:pk>/', TeamMemberDetailView.as_view()),
]