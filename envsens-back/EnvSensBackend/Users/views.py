from datetime import  datetime
import os
import random
import string  # Assurez-vous d'importer le module string ici
from django.core.mail import send_mail
from django.utils import timezone
from django.core.cache import cache
from django.http import  JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from .serializers import *
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
#from Users.models import MyUser, MyUserPermissions, MyGroupPermissions, MyPermission, MyGroup ,MyUserGroup, Pollutant # Import du modèle utilisateur personnalisé
from Users.models import * 
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.views.decorators.csrf import csrf_exempt


from django.db.models.functions import TruncMonth
from django.db.models import Count
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta
#from Users.serializers import MyUserSerializer, MyPermissionSerializer
# Récupération du modèle utilisateur
User = get_user_model()


from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from .additionnalsViews import get_user_permissions

def generate_code_verification(email):
    characters = string.digits
    Codeverification = ''.join(random.choices(characters, k=5))
    send_mail('Code de vérification pour réinitialisation de mot de passe', f'Code : {Codeverification}',
              'romuald237anonymous@gmail.com', [email], fail_silently=False)
    return Codeverification

@api_view(['POST'])
def forget_password_view(request):
    try:
        # Récupérer les données du formulaire
        data = request.data

        # Extraire les informations de l'utilisateur
        email = data.get('email', '')

        # Vérifier si le champ email est fourni
        if not email:
            return JsonResponse({'error': 'Veuillez fournir l\'adresse e-mail'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si un utilisateur correspond à l'adresse e-mail fournie
        user = MyUser.objects.filter(email=email).first()
        if not user:
            return JsonResponse({'error': 'Aucun utilisateur trouvé avec l\'adresse e-mail fournie'}, status=status.HTTP_404_NOT_FOUND)

        # Générer et envoyer le code de vérification
        code = generate_code_verification(user.email)
        cache.set(f'verification_code_{user.email}', code, timeout=300)  # Stocker le code de vérification dans le cache pour 5 minutes

        return JsonResponse({'success': 'Un code de vérification a été envoyé à votre adresse e-mail'}, status=status.HTTP_200_OK)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_code_and_reset_password_view(request):
    try:
        # Récupérer les données du formulaire
        data = request.data

        # Extraire les informations de l'utilisateur
        email = data.get('email', '')
        code = data.get('code', '')
        new_password = data.get('new_password', '')

        # Vérifier si les champs nécessaires sont fournis
        if not email or not code or not new_password:
            return JsonResponse({'error': 'Veuillez fournir l\'adresse e-mail, le code de vérification et le nouveau mot de passe'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si un utilisateur correspond à l'adresse e-mail fournie
        user = MyUser.objects.filter(email=email).first()
        if not user:
            return JsonResponse({'error': 'Aucun utilisateur trouvé avec l\'adresse e-mail fournie'}, status=status.HTTP_404_NOT_FOUND)

        # Vérifier le code de vérification
        stored_code = cache.get(f'verification_code_{user.email}')
        if stored_code != code:
            return JsonResponse({'error': 'Code de vérification incorrect ou expiré'}, status=status.HTTP_400_BAD_REQUEST)

        # Réinitialiser le mot de passe de l'utilisateur
        user.set_password(new_password)
        user.save()

        return JsonResponse({'success': 'Le mot de passe a été réinitialisé avec succès'}, status=status.HTTP_200_OK)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def user_login_view(request):
    try:
        # Récupération des données d'authentification
        username = request.data.get('username')
        password = request.data.get('password')

        # Vérification des données obligatoires
        if not all([username, password]):
            return Response({'error': 'Missing username or password'}, status=status.HTTP_400_BAD_REQUEST)

        # Recherche de l'utilisateur
        user = MyUser.objects.filter(username=username, active=True).first()

        if user is None or not user.check_password(password):
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

        # Génération des jetons JWT
        refresh = RefreshToken.for_user(user)
        serializer = MyUserSerializer(user)
        user.last_login = timezone.now()
        user.save()

        # Récupération des permissions directes de l'utilisateur
        user_permissions = MyUserPermissions.objects.filter(user=user).values_list('permission_id', flat=True)

        # Récupération des groupes de l'utilisateur
        user_groups = MyGroup.objects.filter(group_user_set__user=user)

        # Récupération des permissions des groupes sans doublons
        group_permissions = MyGroupPermissions.objects.filter(group__in=user_groups).values_list('permission_id', flat=True)

        # Fusion des permissions pour éviter les doublons
        all_permissions_ids = set(user_permissions) | set(group_permissions)

        # Sélection des objets de permission uniques
        permissions = MyPermission.objects.filter(id__in=all_permissions_ids)

        # Sérialisation des permissions
        permissions_serializer = MyPermissionSerializer(permissions, many=True)

        response_data = {
            'token': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            },
            'profile': serializer.data,
            'permissions': permissions_serializer.data
        }

        return JsonResponse(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user_view(request):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 1 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Récupération des données de création d'utilisateur
        username = request.data.get('username')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')

        if not all([username, password, first_name, last_name]):
            return Response({'error': 'Champ requis manquant'}, status=status.HTTP_400_BAD_REQUEST)

        if MyUser.objects.filter(username=username).exists():
            return Response({'error': 'Le nom d\'utilisateur existe déjà'}, status=status.HTTP_409_CONFLICT)

        # Création de l'utilisateur
        user = MyUser.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
        )

        # Assignation du nom d'utilisateur du current_user au champ created_by
        user.created_by = current_user.username
        user.save()

        serializer = MyUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Override pour inclure le nom d'utilisateur dans la réponse
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['GET'])
def user_list_view(request):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
    
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 5 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Filtrer les utilisateurs seulement si l'utilisateur est authentifié
        search_text = request.query_params.get('s', None)
        is_paginated = request.query_params.get('ip', 'no').lower() == 'true'
        page_number = request.query_params.get('pn', 1)
        page_size = request.query_params.get('ps', 10)

        users = MyUser.objects.all()
        if search_text:
            users = users.filter(username__icontains=search_text) | \
                    users.filter(first_name__icontains=search_text) | \
                    users.filter(last_name__icontains=search_text)

        if is_paginated:
            paginator = Paginator(users, page_size)
            try:
                users = paginator.page(page_number)
            except PageNotAnInteger:
                users = paginator.page(1)
            except EmptyPage:
                users = paginator.page(paginator.num_pages)

        serializer = MyUserSerializer(users, many=True)

        if is_paginated:
            return JsonResponse({
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page_number,
                'users': serializer.data
            })
        else:
            return JsonResponse(serializer.data, safe=False)  # Retourner directement les données sans pagination
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_user_view(request, user_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
    
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 2 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Suppression de l'utilisateur
        user = MyUser.objects.get(id=user_id)
        user.delete()

        return JsonResponse({'status': 'success'}, status=status.HTTP_200_OK)
    except MyUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_user_view(request, user_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        # Vérifie si l'utilisateur actuel correspond à l'utilisateur dont les informations sont mises à jour
        if current_user.id != user_id:
           return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Récupère l'utilisateur à mettre à jour
        user = MyUser.objects.get(id=user_id)

        # Met à jour les champs nécessaires
        if 'username' in request.data:
            user.username = request.data['username']
        if 'password' in request.data:
            user.set_password(request.data['password'])
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        


        # Assignation du nom d'utilisateur du current_user au champ edit_by
        user.edited_by = current_user.username    

        # Sauvegarde les modifications
        user.save()

        # Sérialise les données de l'utilisateur mis à jour
        serializer = MyUserSerializer(user)

        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    except MyUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_token(request):
    try:
        # Extraire le jeton de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Token missing or invalid'}, status=400)
        
        token = auth_header.split(' ')[1]
        UntypedToken(token)

        return Response({'detail': 'Token is valid'}, status=200)
    except (InvalidToken, TokenError) as e:
        return Response({'error': 'Invalid token', 'details': str(e)}, status=401)

@api_view(['POST'])
def logout_user_view(request):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        # Suppression du token d'authentification de l'utilisateur
        current_user.auth_token.delete()

        return JsonResponse({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except MyUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def add_permissions_to_user_view(request, user_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)


        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 8 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Vérifiez que l'utilisateur existe
        try:
            user = MyUser.objects.get(id=user_id)
        except MyUser.DoesNotExist:
            return JsonResponse({'error': 'Utilisateur non trouvé'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer les IDs de permissions du corps de la requête
        permission_ids = request.data.get('permission_ids')
        if not permission_ids:
            return JsonResponse({'error': 'La liste des IDs de permissions doit être fournie'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérification que les IDs sont bien une liste
        if not isinstance(permission_ids, list):
            return JsonResponse({'error': 'Les IDs de permissions doivent être une liste'}, status=status.HTTP_400_BAD_REQUEST)

        # Récupération des permissions
        permissions = MyPermission.objects.filter(id__in=permission_ids)
        
        # Vérification que toutes les permissions existent
        if permissions.count() != len(permission_ids):
            return JsonResponse({'error': 'Une ou plusieurs permissions fournies n\'existent pas'}, status=status.HTTP_400_BAD_REQUEST)

        all_permissions_exist = True
        for permission in permissions:
            existing_permission = MyUserPermissions.objects.filter(user=user, permission=permission).exists()
            if not existing_permission:
                MyUserPermissions.objects.create(
                    user=user, 
                    permission=permission, 
                    created_by=current_user.username, 
                    edited_by=current_user.username
                )
                all_permissions_exist = False

        if all_permissions_exist:
            return JsonResponse({'message': 'Toutes les permissions existent déjà pour cet utilisateur'}, status=status.HTTP_200_OK)

        # Récupérer et retourner la liste des permissions de l'utilisateur
        user_permissions = MyUserPermissions.objects.filter(user=user)
        response_data = MyPermissionSerializer([up.permission for up in user_permissions], many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['PUT'])
def change_password_view(request):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({"error": "Authorization header missing or invalid"}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(token)
        except TokenError:
            return JsonResponse({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = jwt_auth.get_user(validated_token)


        permissions = get_user_permissions(user)
        if not (user.is_superuser   or  any(p.id == 4 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Vérifier si le mot de passe actuel est correct
        current_password = request.data.get('password')
        if not user.check_password(current_password):
            return JsonResponse({"error": "Current password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mettre à jour le mot de passe
        new_password = request.data.get('npassword')
        if not new_password:
            return JsonResponse({"error": "New password not provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        # Assignation du nom d'utilisateur du current_user au champ edit_by
        user.edited_by = user.username  
        user.save()

        return JsonResponse({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_MyGroupSerializerSERVER_ERROR)       



@api_view(['POST'])
def add_users_to_permission_view(request, permission_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 8 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Vérifiez que la permission existe
        try:
            permission = MyPermission.objects.get(id=permission_id)
        except MyPermission.DoesNotExist:
            return JsonResponse({'error': 'Permission non trouvée'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer les IDs d'utilisateurs du corps de la requête
        user_ids = request.data.get('user_ids')
        if not user_ids:
            return JsonResponse({'error': 'La liste des IDs d\'utilisateurs doit être fournie'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérification que les IDs sont bien une liste
        if not isinstance(user_ids, list):
            return JsonResponse({'error': 'Les IDs d\'utilisateurs doivent être une liste'}, status=status.HTTP_400_BAD_REQUEST)

        # Récupération des utilisateurs
        users = MyUser.objects.filter(id__in=user_ids)
        
        # Vérification que tous les utilisateurs existent
        if users.count() != len(user_ids):
            return JsonResponse({'error': 'Un ou plusieurs utilisateurs fournis n\'existent pas'}, status=status.HTTP_400_BAD_REQUEST)

        all_users_exist = True
        for user in users:
            existing_permission = MyUserPermissions.objects.filter(user=user, permission=permission).exists()
            if not existing_permission:
                MyUserPermissions.objects.create(
                    user=user, 
                    permission=permission, 
                    created_by=current_user.username, 
                    edited_by=current_user.username
                )
                all_users_exist = False

        if all_users_exist:
            return JsonResponse({'message': 'Tous les utilisateurs ont déjà cette permission'}, status=status.HTTP_200_OK)

        # Récupérer et retourner la liste des utilisateurs de la permission
        permission_users = MyUserPermissions.objects.filter(permission=permission)
        response_data = MyUserSerializer([up.user for up in permission_users], many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def add_groups_to_permission_view(request, permission_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 9 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Vérifiez que la permission existe
        try:
            permission = MyPermission.objects.get(id=permission_id)
        except MyPermission.DoesNotExist:
            return JsonResponse({'error': 'Permission non trouvée'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer les IDs de groupes du corps de la requête
        group_ids = request.data.get('group_ids')
        if not group_ids:
            return JsonResponse({'error': 'La liste des IDs de groupes doit être fournie'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérification que les IDs sont bien une liste
        if not isinstance(group_ids, list):
            return JsonResponse({'error': 'Les IDs de groupes doivent être une liste'}, status=status.HTTP_400_BAD_REQUEST)

        # Récupération des groupes
        groups = MyGroup.objects.filter(id__in=group_ids)

        # Vérification que tous les groupes existent
        if groups.count() != len(group_ids):
            return JsonResponse({'error': 'Un ou plusieurs groupes fournis n\'existent pas'}, status=status.HTTP_400_BAD_REQUEST)

        all_groups_exist = True
        for group in groups:
            existing_group = MyGroupPermissions.objects.filter(group=group, permission=permission).exists()
            if not existing_group:
                MyGroupPermissions.objects.create(
                    group=group, 
                    permission=permission, 
                    created_by=current_user.username, 
                    edited_by=current_user.username
                )
                all_groups_exist = False

        if all_groups_exist:
            return JsonResponse({'message': 'Tous les groupes ont déjà été ajoutés à cette permission'}, status=status.HTTP_200_OK)

        # Récupérer et retourner la liste des groupes de la permission
        permission_groups = MyGroupPermissions.objects.filter(permission=permission)
        response_data = MyGroupSerializer([gp.group for gp in permission_groups], many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def remove_permission_from_user_view(request, user_id, permission_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 7 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Recherche de l'autorisation utilisateur spécifique
        user_permission = MyUserPermissions.objects.filter(user_id=user_id, permission_id=permission_id).first()

        if not user_permission:
            return JsonResponse({'error': 'Permission non trouvée pour cet utilisateur'}, status=status.HTTP_400_BAD_REQUEST)

        # Suppression de l'autorisation utilisateur
        user_permission.delete()

        return JsonResponse({'message': 'Permission retirée avec succès de l\'utilisateur'}, status=status.HTTP_200_OK)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def user_detail_view(request, user_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({"error": "Authorization header missing or invalid"}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(token)
        except TokenError:
            return JsonResponse({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = jwt_auth.get_user(validated_token)
        permissions = get_user_permissions(user)
        if not (user.is_superuser   or  any(p.id == 11 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Récupérer l'utilisateur correspondant à l'ID donné
        user = get_object_or_404(MyUser, pk=user_id)

        # Serializer l'utilisateur
        serializer = MyUserSerializer(user)

        # Retourner les détails de l'utilisateur
        return JsonResponse(serializer.data)

    except MyUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def list_user_permissions_view(request, user_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]

        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 15 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)


        # Vérifiez que l'utilisateur existe
        try:
            user = MyUser.objects.get(id=user_id)
        except MyUser.DoesNotExist:
            return JsonResponse({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Récupérer les permissions de l'utilisateur
        user_permissions = MyUserPermissions.objects.filter(user=user)
        permissions = [up.permission for up in user_permissions]

        # Serializer les permissions
        response_data = MyPermissionSerializer(permissions, many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def reset_password_view(request, user_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]

        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)


        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 4 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Vérification de l'existence de l'utilisateur
        try:
            user = MyUser.objects.get(id=user_id)
        except MyUser.DoesNotExist:
            return JsonResponse({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Vérification que le nouveau mot de passe est fourni
        new_password = request.data.get('npassword')
        if not new_password:
            return JsonResponse({'error': 'Nouveau mot de passe non fourni'}, status=status.HTTP_400_BAD_REQUEST)

        # Mise à jour du mot de passe de l'utilisateur
        user.set_password(new_password)
        user.edited_by = current_user
        user.save()

        return JsonResponse({'success': 'Mot de passe réinitialisé avec succès'}, status=status.HTTP_200_OK)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def list_user_non_permissions_view(request, user_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]

        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)


        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 15 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Vérifiez que l'utilisateur existe
        try:
            user = MyUser.objects.get(id=user_id)
        except MyUser.DoesNotExist:
            return JsonResponse({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Récupérer les permissions de l'utilisateur
        user_permissions = MyUserPermissions.objects.filter(user!=user)
        permissions = [up.permission for up in user_permissions]

        # Serializer les permissions
        response_data = MyPermissionSerializer(permissions, many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def list_user_non_permissions_view(request, user_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'En-tête d\'autorisation manquant ou invalide'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]

        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        # Vérifiez que l'utilisateur existe
        try:
            user = MyUser.objects.get(id=user_id)
        except MyUser.DoesNotExist:
            return JsonResponse({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Récupérer les permissions de l'utilisateur
        user_permissions = MyUserPermissions.objects.filter(user=user).values_list('permission_id', flat=True)

        # Récupérer toutes les permissions, sauf celles que l'utilisateur possède
        non_user_permissions = MyPermission.objects.exclude(id__in=user_permissions)

        # Serializer les permissions
        response_data = MyPermissionSerializer(non_user_permissions, many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        
    


class UpdateProfilePicture_view(APIView):
    parser_classes = (MultiPartParser, FormParser)
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            user = request.user
            if 'image' not in request.FILES:
                return JsonResponse({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            image = request.FILES['image']
            user.image = image
            user.save()

            return JsonResponse({"message": "Profile picture updated successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_profile_picture_view(request):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({"error": "Authorization header missing or invalid"}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(token)
        except TokenError:
            return JsonResponse({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = jwt_auth.get_user(validated_token)

        if not user.image:
            return JsonResponse({"error": "No profile picture to delete"}, status=status.HTTP_400_BAD_REQUEST)

        # Delete the image file
        image_path = user.image.path
        if os.path.isfile(image_path):
            os.remove(image_path)
        
        user.image = None
        user.save()

        return JsonResponse({"message": "Profile picture deleted successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

    
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Pollutant
from .serializers import PollutantSerializer
import string
import random

def code_polluant():
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=4))

@api_view(['POST'])
def pollutant_create_view(request):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 21 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
       
        # Vérification si l'utilisateur est administrateur
        if not current_user.is_superuser:
            return JsonResponse({'error': 'User does not have the necessary permissions'}, status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    data = request.data.copy()
    if 'code' not in data or not data['code']:
        # Génération d'un code unique
        unique_code = code_polluant()
        while Pollutant.objects.filter(code=unique_code).exists():
            unique_code = code_polluant()
        data['code'] = unique_code

    serializer = PollutantSerializer(data=data)
   
    if serializer.is_valid():
        # Vérifier si le code du polluant existe déjà
        if Pollutant.objects.filter(code=serializer.validated_data['code']).exists():
            return JsonResponse({"error": "The pollutant code is already used."}, status=status.HTTP_409_CONFLICT)
        serializer.validated_data['created_by'] = current_user.username
        serializer.save()
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    
    return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def pollutant_update_view(request, id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
    

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 22 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)


        # Récupération du polluant à mettre à jour
        try:
            pollutant = Pollutant.objects.get(id=id)
        except Pollutant.DoesNotExist:
            return JsonResponse({'error': f'Pollutant with id {id} does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validation des données et mise à jour du polluant
        serializer = PollutantSerializer(pollutant, data=request.data)
        
        if serializer.is_valid():
            # Vérifier si le code du polluant existe déjà (sauf s'il est le même que l'ancien code)
            new_code = serializer.validated_data.get('code')
            if new_code != pollutant.code and Pollutant.objects.filter(code=new_code).exists():
                return JsonResponse({"error": "The pollutant code is already used."}, status=status.HTTP_409_CONFLICT)
            serializer.validated_data['created_by'] = current_user.username
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def pollutant_delete_view(request, id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        
        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 23 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
  
        # Récupération du polluant à supprimer
        try:
            pollutant = Pollutant.objects.get(id=id)
        except Pollutant.DoesNotExist:
            return JsonResponse({'error': 'Pollutant with id {} does not exist'.format(id)}, status=status.HTTP_404_NOT_FOUND)
        
        # Suppression du polluant
        pollutant.delete()
        
        # Réponse JSON avec les données du polluant supprimé
        serializer = PollutantSerializer(pollutant)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def pollutant_list_view(request):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=400)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        
        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 24 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Récupération du paramètre de recherche 's'
        search_text = request.query_params.get('s', '')
        
        # Recherche des polluants filtrés par le texte de recherche
        pollutants = Pollutant.objects.filter(
            models.Q(code__icontains=search_text) |
            models.Q(name__icontains=search_text) |
            models.Q(description__icontains=search_text)
        )
        
        # Sérialisation des données des polluants
        serializer = PollutantSerializer(pollutants, many=True)
        
        return Response(serializer.data, status=200)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@api_view(['POST'])
def add_pollutant_range_view(request, id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        
        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 49 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Récupération du polluant
        try:
            pollutant = Pollutant.objects.get(id=id)
        except Pollutant.DoesNotExist:
            return JsonResponse({'error': f'Pollutant with id {id} does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupération des données de la requête
        data = request.data
        
        # Validation des données et création de la plage
        serializer = PollutantRangeSerializer(data=data)
        
        if serializer.is_valid():
            serializer.validated_data['created_by'] = current_user.username
            serializer.save(pollutant=pollutant)
            
            # Mettre à jour le serializer du polluant pour inclure les nouvelles plages
            pollutant_serializer = PollutantSerializer(pollutant)
            return Response(pollutant_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def update_pollutant_range_view(request, id, range_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        
        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 50 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Récupération du polluant
        try:
            pollutant = Pollutant.objects.get(id=id)
        except Pollutant.DoesNotExist:
            return JsonResponse({'error': f'Pollutant with id {id} does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérification si la plage de valeurs appartient au polluant spécifié
        try:
            pollutant_range = PollutantRange.objects.get(id=range_id, pollutant=pollutant)
        except PollutantRange.DoesNotExist:
            return JsonResponse({'error': f'Pollutant Range with id {range_id} does not exist or does not belong to the specified pollutant'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupération des données de la requête
        data = request.data
        
        # Validation des données et mise à jour de la plage de valeurs
        serializer = PollutantRangeSerializer(pollutant_range, data=data)
        
        if serializer.is_valid():
            serializer.validated_data['created_by'] = current_user.username
            serializer.save()
            
            # Mettre à jour le serializer du polluant pour inclure les nouvelles plages
            pollutant_serializer = PollutantSerializer(pollutant)
            return Response(pollutant_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
@api_view(['DELETE'])
def delete_pollutant_range_view(request, id, range_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        
        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 51 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Récupération du polluant
        try:
            pollutant = Pollutant.objects.get(id=id)
        except Pollutant.DoesNotExist:
            return JsonResponse({'error': f'Pollutant with id {id} does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérification si la plage de valeurs appartient au polluant spécifié
        try:
            pollutant_range = PollutantRange.objects.get(id=range_id, pollutant=pollutant)
        except PollutantRange.DoesNotExist:
            return JsonResponse({'error': f'Pollutant Range with id {range_id} does not exist or does not belong to the specified pollutant'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Suppression de la plage de valeurs
        pollutant_range.delete()
        
        # Mettre à jour le serializer du polluant pour inclure les plages mises à jour
        pollutant_serializer = PollutantSerializer(pollutant)
        
        return Response(pollutant_serializer.data, status=status.HTTP_204_NO_CONTENT)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_pollutant_detail_view(request, id):
    try:
        # Récupération du polluant
        try:
            pollutant = Pollutant.objects.get(id=id)
        except Pollutant.DoesNotExist:
            return JsonResponse({'error': f'Pollutant with id {id} does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        # Sérialisation du polluant avec ses plages de valeurs associées
        serializer = PollutantSerializer(pollutant)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        



@api_view(['GET'])
def get_pollutant_records_by_month(request, year, month):
    try:
        # Convertir year et month en entier
        year = int(year)
        month = int(month)


        # Calculer les dates de début et de fin pour le mois spécifié
        start_date = datetime(year=month,month= year,day= 1)
        end_date = (start_date + timedelta(days=32)).replace(day=1)  # Début du mois suivant

        # Filtrer les enregistrements de polluants pour le mois spécifié
        records = PollutantRecord.objects.filter(timestamp_device__gte=start_date, timestamp_device__lt=end_date).order_by('pollutant_id')

        data = {}
        for record in records:
            pollutant_id = record.pollutant_id.id
            pollutant_name = record.pollutant_id.name
            pollutant_unit = record.pollutant_id.unit
            if pollutant_id not in data:
                data[pollutant_id] = {
                    'name': pollutant_name,
                    'unit': pollutant_unit,
                    'records': []
                }
            data[pollutant_id]['records'].append({
                'timestamp_device': record.timestamp_device,
                'value': record.value,
                'longitude': record.location.x,
                'latitude': record.location.y
            })

        return Response(data, status=status.HTTP_200_OK)

    except ValueError:
        return JsonResponse({'error': 'Invalid year or month value'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
def get_pollutant_record_months(request):
    try:
        months = PollutantRecord.objects.annotate(month=TruncMonth('timestamp_device')).values('month').annotate(record_count=Count('id')).order_by('month')
        return Response(months, status=status.HTTP_200_OK)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    




@api_view(['GET'])
def get_pollutant_range_detail_view(request, id, range_id):
    try:
        # Vérification de l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = auth_header.split(' ')[1]
        
        # Validation du token JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        
        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 52 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        # Récupération du polluant
        try:
            pollutant = Pollutant.objects.get(id=id)
        except Pollutant.DoesNotExist:
            return JsonResponse({'error': f'Pollutant with id {id} does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        # Récupération de la plage de valeurs spécifique du polluant
        try:
            pollutant_range = pollutant.ranges.get(id=range_id)
        except PollutantRange.DoesNotExist:
            return JsonResponse({'error': f'Pollutant Range with id {range_id} does not exist or does not belong to the specified pollutant'}, status=status.HTTP_404_NOT_FOUND)
        
        # Sérialisation de la plage de valeurs
        serializer = PollutantRangeSerializer(pollutant_range)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .models import Gateway
from .serializers import GatewaySerializer
from rest_framework_simplejwt.authentication import JWTAuthentication

@api_view(['POST'])
def create_gateway_view(request):
    # Vérification de l'en-tête Authorization
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
    
    token = auth_header.split(' ')[1]
    
    # Validation du token JWT
    jwt_auth = JWTAuthentication()
    try:
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
    except Exception as e:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    
    permissions = get_user_permissions(current_user)
    if not (current_user.is_superuser   or  any(p.id == 64 for p in permissions)):
        return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    # Vérification si la gateway existe déjà
    network_id = request.data.get('network_id')
    gwId = request.data.get('gwId')
    if Gateway.objects.filter(network_id=network_id, gwId=gwId).exists():
        return JsonResponse({'error': 'Gateway already exists in this network'}, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'POST':
        serializer = GatewaySerializer(data=request.data)
        if serializer.is_valid():
            serializer.validated_data['created_by'] = current_user  # Assignation du champ created_by
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_gateway_view(request, pk):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
    
    token = auth_header.split(' ')[1]
    jwt_auth = JWTAuthentication()
    try:
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
    except Exception as e:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    
    permissions = get_user_permissions(current_user)
    if not (current_user.is_superuser   or  any(p.id == 66 for p in permissions)):
        return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        gateway = Gateway.objects.get(pk=pk)
    except Gateway.DoesNotExist:
        return JsonResponse({'error': 'Gateway not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = GatewaySerializer(gateway, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.validated_data['edited_by'] = current_user 
        serializer.save()
        return JsonResponse(serializer.data)
    return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_gateway_view(request, pk):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
    
    token = auth_header.split(' ')[1]
    jwt_auth = JWTAuthentication()
    try:
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
    except Exception as e:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    
    permissions = get_user_permissions(current_user)
    if not (current_user.is_superuser   or  any(p.id == 67 for p in permissions)):
        return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        gateway = Gateway.objects.get(pk=pk)
    except Gateway.DoesNotExist:
        return JsonResponse({'error': 'Gateway not found'}, status=status.HTTP_404_NOT_FOUND)
    
    gateway.delete()
    return JsonResponse({'message': 'Gateway deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def list_gateways_view(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
    
    token = auth_header.split(' ')[1]
    jwt_auth = JWTAuthentication()
    try:
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        
    except Exception as e:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

    permissions = get_user_permissions(current_user)
    if not (current_user.is_superuser   or  any(p.id == 63 for p in permissions)):
        return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    gateways = Gateway.objects.all()
    serializer = GatewaySerializer(gateways, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
def gateway_detail_view(request, gateway_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authorization header missing or invalid'}, status=status.HTTP_400_BAD_REQUEST)
    
    token = auth_header.split(' ')[1]
    jwt_auth = JWTAuthentication()
    try:
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
    except Exception as e:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

    permissions = get_user_permissions(current_user)
    if not (current_user.is_superuser   or  any(p.id == 64 for p in permissions)):
        return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        gateway = Gateway.objects.get(pk=gateway_id)
    except Gateway.DoesNotExist:
        return JsonResponse({'error': 'Gateway not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = GatewaySerializer(gateway)
    return JsonResponse(serializer.data, status=status.HTTP_200_OK)


from django.core.mail import send_mail
from django.conf import settings
from .models import Message
from .serializers import MessageSerializer

@api_view(['POST'])
def send_message(request):
    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        recipient = MyUser.objects.get(id=request.data['recipient'])
        # Formater le corps de l'e-mail
        email_body = (
            f"Email: {request.data['user']}\n"
            f"je me nomme : {request.data['name']}\n"
            f"Subject: {request.data['subject']}\n"
            f"Message: {request.data['body']}"
        )
        # Envoyer un e-mail à l'administrateur
        send_mail(
            f"New message from {request.data['user']}",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [settings.ADMIN_EMAIL],
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)