# notifications/views.py
from django.utils import timezone
from rest_framework import viewsets, permissions, decorators
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/notifications/         → list my notifications
    POST /api/notifications/{id}/read/ → mark as read
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @decorators.action(methods=["post"], detail=True, url_path="read")
    def mark_read(self, request, pk=None):
        n = self.get_object()
        if not n.read_at:
            n.read_at = timezone.now()
            n.save(update_fields=["read_at"])
        return Response(NotificationSerializer(n).data)
