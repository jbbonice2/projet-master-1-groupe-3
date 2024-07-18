from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from .serializers import *
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from Users.models import MyUser, MyGroup, MyUserGroup ,MyGroupPermissions, MyPermission, MyUserPermissions # Import du modèle utilisateur personnalisé
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import string
import random

# Récupération du modèle utilisateur
User = get_user_model()

# Fonction pour générer un code de groupe
def code_group():
    characters = string.ascii_letters + string.digits
    Codeverification = ''.join(random.choices(characters, k=4))
    return Codeverification

# Fonction pour créer un groupe
@api_view(['POST'])
def create_group_view(request):
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

        # Vérifier si tous les champs requis sont présents dans la requête
        required_fields = ['description', 'label']
        if not all(field in request.data for field in required_fields):
            return JsonResponse({'error': 'Les champs obligatoires sont manquants'}, status=status.HTTP_400_BAD_REQUEST)

        # Générer un code unique et vérifier s'il n'existe pas déjà
        code = code_group()
        while MyGroup.objects.filter(code=code).exists():
            code = code_group()

        # Ajouter le code généré aux données de la requête
        data = request.data.copy()
        data['code'] = code
        
        # Créer un sérialiseur avec les données de la requête
        serializer = MyGroupSerializer(data=data)

        # Valider les données du sérialiseur
        if serializer.is_valid():
            # Ajouter l'utilisateur courant comme créateur du groupe
            serializer.validated_data['created_by'] = current_user.username
            # Sauvegarder le groupe
            group = serializer.save()
            # Renvoyer les données du groupe créé
            return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Fonction pour mettre à jour un groupe
@api_view(['PUT'])
def update_group_view(request, id):
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

        # Récupération du groupe par son ID
        group = get_object_or_404(MyGroup, pk=id)
        
        # Récupération des données du corps de la requête
        data = request.data
        label = data.get('label')
        description = data.get('description')

        # Vérification des champs obligatoires
        if not description or not label:
            return JsonResponse({'error': 'Les champs description et label sont obligatoires'}, status=status.HTTP_400_BAD_REQUEST)

        # Mise à jour des informations du groupe
        group.label = label
        group.description = description
        group.edited_by = current_user.username
        group.save()

        # Sérialisation du groupe mis à jour
        serializer = MyGroupSerializer(group)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    except MyGroup.DoesNotExist:
        return JsonResponse({'error': 'Groupe non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Fonction pour supprimer un groupe
@api_view(['DELETE'])
def delete_group_view(request, id):
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
    
        # Récupération du groupe par son ID
        group = get_object_or_404(MyGroup, pk=id)
        
        # Vérification s'il y a des utilisateurs liés à ce groupe
       # if MyUserGroup.objects.filter(group=group).exists():
        #    return JsonResponse({'error': 'Impossible de supprimer le groupe avec des utilisateurs associés'}, status=status.HTTP_400_BAD_REQUEST)

        # Suppression du groupe
        group.delete()
        return JsonResponse({'message': 'Groupe supprimé avec succès'}, status=status.HTTP_204_NO_CONTENT)
    except MyGroup.DoesNotExist:
        return JsonResponse({'error': 'Groupe non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

# Fonction pour lister les groupes
@api_view(['GET'])
def group_list_view(request):
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

        # Filtrer les utilisateurs seulement si l'utilisateur est authentifié
        search_text = request.query_params.get('s', None)
        is_paginated = request.query_params.get('ip', 'no').lower() == 'true'
        page_number = int(request.query_params.get('pn', 1))
        page_size = int(request.query_params.get('ps', 10))

        groups = MyGroup.objects.all()
        if search_text:
            groups = groups.filter(code__icontains=search_text) | \
                     groups.filter(label__icontains=search_text) | \
                     groups.filter(description__icontains=search_text)

        if is_paginated:
            paginator = Paginator(groups, page_size)
            try:
                groups = paginator.page(page_number)
            except PageNotAnInteger:
                groups = paginator.page(1)
            except EmptyPage:
                groups = paginator.page(paginator.num_pages)

        serializer = MyGroupSerializer(groups, many=True)

        if is_paginated:
            return JsonResponse({
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page_number,
                'groups': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Fonction pour obtenir les détails d'un groupe
@api_view(['GET'])
def group_detail_view(request, group_id):
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
        
        # Récupération du groupe par son ID
        group = get_object_or_404(MyGroup, pk=group_id)
        
        # Sérialisation du groupe
        serializer = MyGroupSerializer(group)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    except MyGroup.DoesNotExist:
        return JsonResponse({'error': 'Groupe non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#Vue pour obtenir la liste des groupes d'un utilisateur
@api_view(['GET'])
def list_groups_of_user_view(request, user_id):
    
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

        # Récupération de l'utilisateur par son ID
        user = get_object_or_404(MyUser, pk=user_id)

        # Récupération des groupes auxquels l'utilisateur appartient
        groups_of_user = MyGroup.objects.filter(group_user_set__user=user)
        
        # Sérialisation des groupes
        serializer = MyGroupSerializer(groups_of_user, many=True)
        return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except MyUser.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vue pour obtenir la liste des utilisateurs d'un groupe
@api_view(['GET'])
def list_users_in_group_view(request, group_id):
   
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

        # Récupération du groupe par son ID
        group = get_object_or_404(MyGroup, pk=group_id)

        # Récupération des utilisateurs appartenant à ce groupe
        users_in_group = MyUser.objects.filter(user_groups_set__group=group)
        
        # Sérialisation des utilisateurs
        serializer = MyUserSerializer(users_in_group, many=True)
        return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except MyGroup.DoesNotExist:
        return JsonResponse({'error': 'Groupe non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def permission_list_view(request):
    try:
        # Filtrer les permissions seulement si l'utilisateur est authentifié
        search_text = request.query_params.get('s', None)
        is_paginated = request.query_params.get('ip', 'no').lower() == 'true'
        page_number = int(request.query_params.get('pn', 1))
        page_size = int(request.query_params.get('ps', 10))

        permissions = MyPermission.objects.all()
        if search_text:
            permissions = permissions.filter(
                code__icontains=search_text) | \
                          permissions.filter(label__icontains=search_text) | \
                          permissions.filter(description__icontains=search_text)

        if is_paginated:
            paginator = Paginator(permissions, page_size)
            permissions = paginator.page(page_number)

            return JsonResponse({
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page_number,
                'permissions': MyPermissionSerializer(permissions, many=True).data
            }, status=status.HTTP_200_OK)
        else:
            return JsonResponse(MyPermissionSerializer(permissions, many=True).data, safe=False,status=status.HTTP_200_OK)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def add_groups_to_user_view(request, user_id):
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
            return JsonResponse({'error': 'Utilisateur non trouvé'}, status=status.HTTP_400_BAD_REQUEST)
        
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
            existing_group = MyUserGroup.objects.filter(user=user, group=group).exists()
            if not existing_group:
                MyUserGroup.objects.create(
                    user=user, 
                    group=group, 
                    created_by=current_user.username, 
                    edited_by=current_user.username
                )
                all_groups_exist = False

        if all_groups_exist:
            return JsonResponse({'message': 'L\'utilisateur a déjà tous ces groupes'}, status=status.HTTP_200_OK)

        # Récupérer et retourner la liste des groupes de l'utilisateur
        user_groups = MyUserGroup.objects.filter(user=user)
        response_data = MyGroupSerializer([ug.group for ug in user_groups], many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def add_users_to_group_view(request, group_id):
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

        # Vérifiez que le groupe existe
        try:
            group = MyGroup.objects.get(id=group_id)
        except MyGroup.DoesNotExist:
            return JsonResponse({'error': 'Groupe non trouvé'}, status=status.HTTP_400_BAD_REQUEST)
        
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
            existing_user_group = MyUserGroup.objects.filter(user=user, group=group).exists()
            if not existing_user_group:
                MyUserGroup.objects.create(
                    user=user, 
                    group=group, 
                    created_by=current_user.username, 
                    edited_by=current_user.username
                )
                all_users_exist = False

        if all_users_exist:
            return JsonResponse({'message': 'Tous les utilisateurs ont déjà été ajoutés à ce groupe'}, status=status.HTTP_400_BAD_REQUEST)

        # Récupérer et retourner la liste des utilisateurs du groupe
        group_users = MyUserGroup.objects.filter(group=group)
        response_data = MyUserSerializer([ug.user for ug in group_users], many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        


# Fonction pour supprimer un utilisateur d'un groupe
@api_view(['DELETE'])
def delete_user_from_group_view(request, group_id, user_id):
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
        
        # Vérifiez si le groupe existe
        group = get_object_or_404(MyGroup, id=group_id)
        
        # Vérifiez si l'utilisateur existe
        user = get_object_or_404(MyUser, id=user_id)

        # Vérifiez si l'utilisateur est dans le groupe
        user_group = get_object_or_404(MyUserGroup, user=user, group=group)

        # Supprimez l'utilisateur du groupe
        user_group.delete()

        return JsonResponse({"message": "Utilisateur supprimé avec succès du groupe"}, status=status.HTTP_200_OK)
    except MyGroup.DoesNotExist:
        return JsonResponse({"error": "Groupe non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    except MyUser.DoesNotExist:
        return JsonResponse({"error": "Utilisateur non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    except MyUserGroup.DoesNotExist:
        return JsonResponse({"error": "L'utilisateur n'est pas dans le groupe spécifié"}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def remove_permission_from_group_view(request, group_id, permission_id):
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

        # Recherche de l'autorisation de groupe spécifique
        group_permission = MyGroupPermissions.objects.filter(group_id=group_id, permission_id=permission_id).first()

        if not group_permission:
            return JsonResponse({'error': 'Permission non trouvée pour ce groupe'}, status=status.HTTP_400_BAD_REQUEST)

        # Suppression de l'autorisation de groupe
        group_permission.delete()

        return JsonResponse({'message': 'Permission retirée avec succès du groupe'}, status=status.HTTP_200_OK)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        


@api_view(['GET'])
def list_group_permissions_view(request, group_id):
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

        # Vérifiez que le groupe existe
        try:
            group = MyGroup.objects.get(id=group_id)
        except MyGroup.DoesNotExist:
            return JsonResponse({'error': 'Groupe non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Récupérer les permissions du groupe
        group_permissions = MyGroupPermissions.objects.filter(group=group)
        permissions = [gp.permission for gp in group_permissions]

        # Serializer les permissions
        response_data = MyPermissionSerializer(permissions, many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def add_permissions_to_group_view(request, group_id):
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

        # Vérifiez que le groupe existe
        try:
            group = MyGroup.objects.get(id=group_id)
        except MyGroup.DoesNotExist:
            return JsonResponse({'error': 'Groupe non trouvé'}, status=status.HTTP_400_BAD_REQUEST)
        
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
            existing_permission = MyGroupPermissions.objects.filter(group=group, permission=permission).exists()
            if not existing_permission:
                MyGroupPermissions.objects.create(
                    group=group, 
                    permission=permission, 
                    created_by=current_user.username, 
                    edited_by=current_user.username
                )
                all_permissions_exist = False

        if all_permissions_exist:
            return JsonResponse({'message': 'Toutes les permissions ont déjà été ajoutées à ce groupe'}, status=status.HTTP_200_OK)

        # Récupérer et retourner la liste des permissions du groupe
        group_permissions = MyGroupPermissions.objects.filter(group=group)
        response_data = MyGroupPermissionsSerializer(group_permissions, many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def list_user_non_groups_view(request, user_id):
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

        # Récupérer les groupes de l'utilisateur
        user_groups = MyUserGroup.objects.filter(user=user).values_list('group', flat=True)
        
        # Récupérer les groupes qui n'appartiennent pas à l'utilisateur
        non_user_groups = MyGroup.objects.exclude(id__in=user_groups)

        # Sérialiser les groupes
        response_data = MyGroupSerializer(non_user_groups, many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def list_group_non_users_view(request, group_id):
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

        # Vérifiez que le groupe existe
        try:
            group = MyGroup.objects.get(id=group_id)
        except MyGroup.DoesNotExist:
            return JsonResponse({'error': 'Groupe non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Récupérer les utilisateurs du groupe
        group_users = MyUserGroup.objects.filter(group=group).values_list('user', flat=True)
        
        # Récupérer les utilisateurs qui n'appartiennent pas au groupe
        non_group_users = MyUser.objects.exclude(id__in=group_users)

        # Sérialiser les utilisateurs
        response_data = MyUserSerializer(non_group_users, many=True).data

        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        
