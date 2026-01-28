# drugs/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Drug
from .serializers import DrugSerializer

class DrugViewSet(viewsets.ModelViewSet):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
    permission_classes = [IsAuthenticated]
