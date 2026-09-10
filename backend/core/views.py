from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from core.models import User, UserRole
from core.serializers import UserSerializer, CreateUserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    search_fields = ['username', 'first_name', 'last_name', 'email', 'department']
    filterset_fields = ['role', 'department', 'status']

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserSerializer
        return UserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
    """
    Login endpoint supporting credentials: username / employee_id / email + password, or role switch
    """
    role = request.data.get('role')
    username = request.data.get('username')
    password = request.data.get('password')

    user = None
    if username:
        cleaned_username = str(username).strip()
        # 1. Search by username (case-insensitive)
        user = User.objects.filter(username__iexact=cleaned_username).first()

        # 2. Search by email (case-insensitive)
        if not user:
            user = User.objects.filter(email__iexact=cleaned_username).first()

        # 3. Search by EmployeeProfile employee_id (case-insensitive)
        if not user:
            try:
                from employees.models import EmployeeProfile
                emp = EmployeeProfile.objects.filter(employee_id__iexact=cleaned_username).select_related('user').first()
                if emp and emp.user:
                    user = emp.user
            except Exception:
                pass

        if user:
            # Check password
            pw_to_check = str(password).strip() if password is not None else ""
            is_valid_pw = user.check_password(pw_to_check) if pw_to_check else False
            
            # Allow fallback default password 'password123' or empty password for accounts without usable password
            if not is_valid_pw and (pw_to_check == 'password123' or not user.has_usable_password()):
                is_valid_pw = True

            if is_valid_pw:
                return Response({
                    'success': True,
                    'message': f'Logged in as {user.get_full_name() or user.username} ({user.get_role_display()})',
                    'user': UserSerializer(user).data
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid password. Please enter the correct password.'
                }, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({
                'success': False,
                'message': f'No user account found for "{cleaned_username}". Please check with your Administrator.'
            }, status=status.HTTP_401_UNAUTHORIZED)

    elif role:
        user = User.objects.filter(role=role).first()
        if user:
            return Response({
                'success': True,
                'message': f'Logged in as {user.get_full_name()} ({user.get_role_display()})',
                'user': UserSerializer(user).data
            })

    # If no parameters sent, check if default founder exists
    founder = User.objects.filter(role=UserRole.FOUNDER).first() or User.objects.first()
    if founder:
        return Response({
            'success': True,
            'message': f'Logged in as {founder.get_full_name()} ({founder.get_role_display()})',
            'user': UserSerializer(founder).data
        })

    return Response({
        'success': False,
        'message': 'Please provide Username / Employee ID and Password.'
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def auth_me(request):
    """
    Get current logged in user details based on role query/header or default
    """
    role_param = request.GET.get('role')
    user_id = request.GET.get('userId')

    user = None
    if user_id:
        user = User.objects.filter(id=user_id).first()
    elif role_param:
        user = User.objects.filter(role=role_param).first()

    if not user:
        if request.user and request.user.is_authenticated:
            user = request.user
        else:
            founder = User.objects.filter(role=UserRole.FOUNDER).first()
            user = founder or User.objects.first()

    if user:
        return Response({
            'success': True,
            'user': UserSerializer(user, context={'request': request}).data
        })
    return Response({'success': False, 'message': 'No user found'}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def switch_active_role(request):
    """
    Switch active account to the dedicated role user
    """
    role = request.data.get('role')
    valid_roles = [choice[0] for choice in UserRole.choices]
    if role not in valid_roles:
        return Response({'success': False, 'message': f'Invalid role. Choose from {valid_roles}'}, status=400)

    target_user = User.objects.filter(role=role).first()
    if target_user:
        return Response({
            'success': True,
            'message': f'Switched session to {target_user.get_full_name()} ({target_user.get_role_display()})',
            'user': UserSerializer(target_user, context={'request': request}).data
        })

    # If role user doesn't exist yet, create or update a fallback
    user = User.objects.filter(username='demo_user').first() or User.objects.first()
    if user:
        user.role = role
        user.save()
        return Response({'success': True, 'user': UserSerializer(user, context={'request': request}).data})

    return Response({'success': False, 'message': 'Target role account not found'}, status=404)

def _resolve_target_user(request):
    user_id = request.data.get('user_id') or request.query_params.get('userId') or request.data.get('id')
    role_param = request.data.get('role') or request.query_params.get('role')
    user = None
    if user_id:
        user = User.objects.filter(id=user_id).first()
    elif role_param:
        user = User.objects.filter(role=role_param).first()

    if not user:
        if request.user and request.user.is_authenticated:
            user = request.user
        else:
            user = User.objects.filter(role=UserRole.FOUNDER).first() or User.objects.first()
    return user

@api_view(['GET', 'PUT', 'PATCH', 'POST'])
@permission_classes([AllowAny])
def user_profile(request):
    """
    Get or update user profile with image upload, bio, and contact details
    Persists directly to db.sqlite3 and media storage
    """
    user = _resolve_target_user(request)
    if not user:
        return Response({'success': False, 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'success': True,
            'user': UserSerializer(user, context={'request': request}).data
        })

    # PUT / PATCH / POST
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    email = request.data.get('email')
    phone = request.data.get('phone')
    department = request.data.get('department')
    designation = request.data.get('designation')
    bio = request.data.get('bio')
    remove_image = request.data.get('remove_image')

    if first_name is not None:
        user.first_name = str(first_name).strip()
    if last_name is not None:
        user.last_name = str(last_name).strip()
    if email is not None:
        user.email = str(email).strip()
    if phone is not None:
        user.phone = str(phone).strip()
    if department is not None:
        user.department = str(department).strip()
    if designation is not None:
        user.designation = str(designation).strip()
    if bio is not None:
        user.bio = str(bio).strip()

    # Regenerate avatar initials if name is updated
    if user.first_name:
        user.avatar_text = f"{user.first_name[0]}{(user.last_name[0] if user.last_name else '')}".upper()

    # Process profile image file upload
    if 'profile_image' in request.FILES:
        user.profile_image = request.FILES['profile_image']
    elif remove_image in ['true', True, '1']:
        if user.profile_image:
            try:
                user.profile_image.delete(save=False)
            except Exception:
                pass
            user.profile_image = None

    user.save()

    return Response({
        'success': True,
        'message': 'Profile data updated and persisted in db.sqlite3 successfully!',
        'user': UserSerializer(user, context={'request': request}).data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request):
    """
    Change user password and update hash in db.sqlite3
    """
    user = _resolve_target_user(request)
    if not user:
        return Response({'success': False, 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')

    if not new_password or len(str(new_password).strip()) < 4:
        return Response({
            'success': False,
            'message': 'New password must be at least 4 characters long.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if current_password:
        if not user.check_password(current_password) and user.has_usable_password() and current_password != 'password123':
            return Response({
                'success': False,
                'message': 'Current password is incorrect.'
            }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(str(new_password).strip())
    user.save()

    return Response({
        'success': True,
        'message': 'Password updated and saved into db.sqlite3 successfully!'
    })

