from rest_framework import serializers
from core.models import User, UserRole

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'phone', 'avatar_text', 'department',
            'designation', 'status', 'profile_image', 'profile_image_url', 'bio', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_profile_image_url(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return f"http://localhost:8000{obj.profile_image.url}"
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.profile_image:
            url = instance.profile_image.url
            if not url.startswith('http'):
                request = self.context.get('request')
                if request:
                    url = request.build_absolute_uri(url)
                else:
                    url = f"http://localhost:8000{url}"
            data['profile_image'] = url
            data['profile_image_url'] = url
        return data


    def validate_role(self, value):
        if value == UserRole.FOUNDER:
            request = self.context.get('request')
            instance = getattr(self, 'instance', None)
            qs = User.objects.filter(role=UserRole.FOUNDER)
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError("BUSINESS OS SECURITY ERROR: Only one Founder account is permitted in JRAM Groups.")
        return value

class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'phone', 'department', 'designation'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
