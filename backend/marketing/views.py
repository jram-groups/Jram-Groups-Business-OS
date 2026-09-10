from rest_framework import viewsets
from marketing.models import SocialMediaClient
from marketing.serializers import SocialMediaClientSerializer

class SocialMediaClientViewSet(viewsets.ModelViewSet):
    queryset = SocialMediaClient.objects.all().order_by('-created_at')
    serializer_class = SocialMediaClientSerializer
    search_fields = ['client__name', 'package_name', 'instagram_handle', 'facebook_page']
    filterset_fields = ['payment_status', 'content_status', 'client']
