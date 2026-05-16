from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Project, TeamMember, Task


def get_tasks_for_user(user):
    admin_project_ids = TeamMember.objects.filter(
        user=user, role='ADMIN'
    ).values_list('project_id', flat=True)
    return Task.objects.filter(
        Q(project_id__in=admin_project_ids) |
        Q(project__members__user=user, assigned_to=user)
    ).distinct()
from .serializers import (
    RegisterSerializer,
    ProjectSerializer,
    TeamMemberSerializer,
    TaskSerializer,
    UserSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(members__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        TeamMember.objects.create(user=self.request.user, project=project, role='ADMIN')

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(members__user=user).distinct()

    def perform_update(self, serializer):
        project = self.get_object()
        member = TeamMember.objects.filter(user=self.request.user, project=project).first()
        if not member or member.role != 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can update the project.")
        serializer.save()

    def perform_destroy(self, instance):
        member = TeamMember.objects.filter(user=self.request.user, project=instance).first()
        if not member or member.role != 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete the project.")
        instance.delete()

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return get_tasks_for_user(self.request.user)

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        member = TeamMember.objects.filter(user=self.request.user, project=project).first()
        if not member or member.role != 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must be an admin of the project to create tasks.")
        serializer.save()

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return get_tasks_for_user(self.request.user)

    def perform_update(self, serializer):
        task = self.get_object()
        project = task.project
        member = TeamMember.objects.filter(user=self.request.user, project=project).first()
        
        if not member:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not a member of this project.")
            
        if member.role == 'MEMBER':
            if task.assigned_to != self.request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Members can only update their assigned tasks.")
                
        serializer.save()

    def perform_destroy(self, instance):
        project = instance.project
        member = TeamMember.objects.filter(user=self.request.user, project=project).first()
        
        if not member or member.role != 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete tasks.")
            
        instance.delete()

class TeamMemberListCreateView(generics.ListCreateAPIView):
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return TeamMember.objects.filter(project_id=project_id)
        return TeamMember.objects.filter(project__members__user=self.request.user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        member = TeamMember.objects.filter(user=self.request.user, project=project).first()
        if not member or member.role != 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must be an admin to add members.")
        serializer.save()

class TeamMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return TeamMember.objects.filter(project__members__user=user).distinct()

    def perform_destroy(self, instance):
        project = instance.project
        member = TeamMember.objects.filter(user=self.request.user, project=project).first()
        if not member or member.role != 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can remove members.")
        if instance.role == 'ADMIN' and TeamMember.objects.filter(project=project, role='ADMIN').count() == 1:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Cannot remove the last admin of the project.")
        instance.delete()

    def perform_update(self, serializer):
        project = self.get_object().project
        member = TeamMember.objects.filter(user=self.request.user, project=project).first()
        if not member or member.role != 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can update members.")
        serializer.save()
