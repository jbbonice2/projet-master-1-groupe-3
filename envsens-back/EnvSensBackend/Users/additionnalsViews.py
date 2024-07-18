import random
import string
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from .models import City, Country, Device, Gateway, Language, MyGroup, MyGroupPermissions, MyPermission, MyUser, MyUserPermissions, Network, Pollutant, PollutantRecord, Comment
from .serializers import  CommentSerializer, CountrySerializer, DeviceSerializer, GatewaySerializer, LanguageSerializer, CitySerializer, NestedPollutantRecordSerializer, NetworkSerializer, PollutantRecordSerializer, UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.gis.geos import Point
from rest_framework.views import APIView
import requests
from django.core.files.base import ContentFile


def generate_pollutant_code():
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=6))

def get_user_permissions(user):
    user_permissions = MyUserPermissions.objects.filter(user=user).values_list('permission_id', flat=True)
    user_groups = MyGroup.objects.filter(group_user_set__user=user)
    group_permissions = MyGroupPermissions.objects.filter(group__in=user_groups).values_list('permission_id', flat=True)
    all_permissions_ids = set(user_permissions) | set(group_permissions)
    return MyPermission.objects.filter(id__in=all_permissions_ids)

@permission_classes([AllowAny])
@api_view(['POST'])
def create_country_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 25 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        required_fields = ['name', 'code']
        if not all(field in request.data for field in required_fields):
            return JsonResponse({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['created_by'] = current_user.username
        serializer = CountrySerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([AllowAny])
@api_view(['PUT'])
def update_country_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 26 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            country = Country.objects.get(pk=pk)
            country.edited_by = current_user.username
        except Country.DoesNotExist:
            return JsonResponse({'error': 'Country not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CountrySerializer(country, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@permission_classes([AllowAny])
@api_view(['DELETE'])
def delete_country_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 27 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            country = Country.objects.get(pk=pk)
            country.delete()
            return JsonResponse({'message': 'Country deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Country.DoesNotExist:
            return JsonResponse({'error': 'Country not found'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([AllowAny])
@api_view(['GET'])
def list_countries_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 28 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        countries = Country.objects.all()
        serializer = CountrySerializer(countries, many=True)
        return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@permission_classes([AllowAny])
@api_view(['GET'])
def country_details_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 28 for p in permissions)):  # Assurez-vous d'utiliser l'ID de permission correct pour la suppression
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        country = Country.objects.get(pk=pk)
        serializer = CountrySerializer(country)

        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    except City.DoesNotExist:
        return JsonResponse({'error': 'Country not found'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    





@permission_classes([AllowAny])
@api_view(['POST'])
def create_language_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 29 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        required_fields = ['label', 'code']
        if not all(field in request.data for field in required_fields):
            return JsonResponse({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['created_by'] = current_user.username
        serializer = LanguageSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([AllowAny])
@api_view(['PUT'])
def update_language_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 30 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            language = Language.objects.get(pk=pk)
            language.edited_by = current_user.username
        except Language.DoesNotExist:
            return JsonResponse({'error': 'Language not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LanguageSerializer(language, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





@permission_classes([AllowAny])
@api_view(['DELETE'])
def delete_language_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 31 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            language = Language.objects.get(pk=pk)
            language.delete()
            return JsonResponse({'message': 'Language deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Language.DoesNotExist:
            return JsonResponse({'error': 'Language not found'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@permission_classes([AllowAny])
@api_view(['GET'])
def list_languages_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 32 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        languages = Language.objects.all()
        serializer = LanguageSerializer(languages, many=True)
        return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





@permission_classes([AllowAny])
@api_view(['GET'])
def list_cities_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 36 for p in permissions)):  # Assurez-vous d'utiliser l'ID de permission correct
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        cities = City.objects.all()
        serializer = CitySerializer(cities, many=True)
        return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



@permission_classes([AllowAny])
@api_view(['POST'])
def create_city_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 33 for p in permissions)):  # Assurez-vous d'utiliser l'ID de permission correct pour la création
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data.copy()
        data['created_by'] = current_user.username
        data['country_id'] = data['country']

        serializer = CitySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([AllowAny])
@api_view(['PUT'])
def update_city_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 34 for p in permissions)):  # Assurez-vous d'utiliser l'ID de permission correct pour la mise à jour
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        city = City.objects.get(pk=pk)
        city.edited_by = current_user.username
        serializer = CitySerializer(city, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except City.DoesNotExist:
        return JsonResponse({'error': 'City not found'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@permission_classes([AllowAny])
@api_view(['DELETE'])
def delete_city_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 35 for p in permissions)):  # Assurez-vous d'utiliser l'ID de permission correct pour la suppression
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        city = City.objects.get(pk=pk)
        city.delete()
        return JsonResponse({'message': 'City deleted successfully'}, status=status.HTTP_200_OK)
    except City.DoesNotExist:
        return JsonResponse({'error': 'City not found'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


@permission_classes([AllowAny])
@api_view(['GET'])
def city_details_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 36 for p in permissions)):  # Assurez-vous d'utiliser l'ID de permission correct pour la suppression
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        city = City.objects.get(pk=pk)
        serializer = CitySerializer(city)

        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    except City.DoesNotExist:
        return JsonResponse({'error': 'City not found'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    





@permission_classes([AllowAny])
@api_view(['POST'])
def create_network_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not ( current_user.is_superuser  or any(p.id == 37 for p in permissions)):  # Assurez-vous d'avoir la bonne permission ID
            return JsonResponse({'error': f'Unauthorized {current_user.is_superuser}'}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data.copy()
        data['created_by'] = current_user.username
        data['city_id'] = data['city']
        serializer = NetworkSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@permission_classes([AllowAny])
@api_view(['PUT'])
def update_network_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 38 for p in permissions)):  # Assurez-vous d'avoir la bonne permission ID
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            network = Network.objects.get(pk=pk)
            network.edited_by = current_user.username  # Assurez-vous que le champ `edited_by` existe
        except Network.DoesNotExist:
            return JsonResponse({'error': 'Network not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = NetworkSerializer(network, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([AllowAny])
@api_view(['DELETE'])
def delete_network_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 39 for p in permissions)):  # Assurez-vous d'avoir la bonne permission ID
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            network = Network.objects.get(pk=pk)
            network.delete()
            return JsonResponse({'message': 'Network deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Network.DoesNotExist:
            return JsonResponse({'error': 'Network not found'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@permission_classes([AllowAny])
@api_view(['GET'])
def get_network_view(request, pk):
    try:
        print('sldnsldnvsnvosbdvosrbviow\n\n')
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser   or  any(p.id == 40 for p in permissions)):  # Assurez-vous d'avoir la bonne permission ID
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            network = Network.objects.get(pk=pk)
            serializer = NetworkSerializer(network)
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        except Network.DoesNotExist:
            return JsonResponse({'error': 'Network not found'}, status=status.HTTP_404_NOT_FOUND)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@permission_classes([AllowAny])
@api_view(['GET'])
def list_networks_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        permissions = get_user_permissions(current_user)
        
        if current_user.is_superuser:
            networks = Network.objects.all()
        else:
            networks = Network.objects.filter(created_by=current_user)
            if any(p.id == 41 for p in permissions):
                networks = networks | Network.objects.all()
        
        serializer = NetworkSerializer(networks.distinct(), many=True)
        return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    




@api_view(['GET'])
@permission_classes([AllowAny])
def city_networks_view(request, id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or  any(p.id == 41 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            city = City.objects.get(pk=id)
        except City.DoesNotExist:
            return JsonResponse({'error': 'City not found'}, status=status.HTTP_404_NOT_FOUND)

        networks = Network.objects.filter(city=city)
        serializer = NetworkSerializer(networks, many=True)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    









@api_view(['GET'])
@permission_classes([AllowAny])
def device_list_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or  any(p.id == 53 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        devices = Device.objects.all()
        serializer = DeviceSerializer(devices, many=True)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def device_create_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or  any(p.id == 55 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)


        data = request.data.copy()
        data['created_by'] = current_user.username
        data['geteway_id'] = data['geteway']
        serializer = DeviceSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        print(e)
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def device_detail_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or  any(p.id == 54 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            device = Device.objects.get(pk=pk)
        except Device.DoesNotExist:
            return JsonResponse({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DeviceSerializer(device)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([AllowAny])
def device_update_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or  any(p.id == 56 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            device = Device.objects.get(pk=pk)
            device.edited_by = current_user.username
        except Device.DoesNotExist:
            return JsonResponse({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DeviceSerializer(device, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def device_delete_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or  any(p.id == 57 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            device = Device.objects.get(pk=pk)
        except Device.DoesNotExist:
            return JsonResponse({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

        device.delete()
        return JsonResponse({'message': 'Device deleted successfully'}, status=status.HTTP_204_NO_CONTENT, safe=False)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    











@permission_classes([AllowAny])
@api_view(['GET'])
def list_gateway_networks_view(request, pk=None):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        permissions = get_user_permissions(current_user)
        if  not (current_user.is_superuser or  any(p.id == 41 for p in permissions)):  # Assurez-vous d'utiliser l'ID de permission correct
            return JsonResponse({'error': f'Unauthorized to perfom this action'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            network = Network.objects.get(pk=pk)
        except Network.DoesNotExist:
            return JsonResponse({'error': 'Network not found'}, status=status.HTTP_404_NOT_FOUND)
        

        cities = Gateway.objects.filter(network_id=network.id)
        serializer = GatewaySerializer(cities, many=True)
        return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
  


@permission_classes([AllowAny])
@api_view(['GET'])
def list_netwok_devices_list(request, pk=None):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)
        permissions = get_user_permissions(current_user)
        if  not (current_user.is_superuser or  any(p.id == 41 for p in permissions)):  # Assurez-vous d'utiliser l'ID de permission correct
            return JsonResponse({'error': f'Unauthorized to perfom this action'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            network = Network.objects.get(pk=pk)
        except Network.DoesNotExist:
            return JsonResponse({'error': 'Network not found'}, status=status.HTTP_404_NOT_FOUND)
        
        devices = Device.objects.filter(network=network)
        serializer = DeviceSerializer(devices, many=True)
        return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    








@api_view(['GET'])
@permission_classes([AllowAny])
def pollutant_record_list_view(request):
    try:

        records = PollutantRecord.objects.all()
        serializer = PollutantRecordSerializer(records, many=True)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_sequence_number():
    last_record = PollutantRecord.objects.order_by('-sequence_number').first()
    if last_record:
        return last_record.sequence_number + 1
    return 1

@api_view(['POST'])
@permission_classes([AllowAny])
def pollutant_record_create_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or any(p.id == 60 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        serializer = NestedPollutantRecordSerializer(data=data, many=True)
        if serializer.is_valid():
            for item in serializer.validated_data:
                gwid = item['gwid']
                gateway = get_object_or_404(Gateway, id=gwid) # gwId
                gateway.location = Point(item['longitude'], item['latitude'])
                gateway.save()

                for device_data in item['data']:
                    device_id = device_data['device_id']
                    device = get_object_or_404(Device,id=device_id) # dev_id
                    device.location = Point(device_data['longitude'], device_data['latitude'])
                    device.save()

                    for record in device_data['data']:
                        pollutant_record_data = {
                            'sequence_number': generate_sequence_number(),
                            'value': record['value'],
                            'reception_date': device_data['timestamp'],
                            'endDevice_id': device_id,
                            'pollutant_id': record['pollutantId'],
                            'gateway_id': gateway.id,
                            'latitude': device_data['latitude'],
                            'longitude': device_data['longitude'],
                            'timestamp_device': device_data['timestamp']
                        }
                        pollutant_record_serializer = PollutantRecordSerializer(data=pollutant_record_data)
                        if pollutant_record_serializer.is_valid():
                            pollutant_record_serializer.save()
                        else:
                            return JsonResponse(pollutant_record_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return JsonResponse({'status': 'Success'}, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['GET'])
@permission_classes([AllowAny])
def pollutant_record_detail_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or any(p.id == 59 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            record = PollutantRecord.objects.get(pk=pk)
        except PollutantRecord.DoesNotExist:
            return JsonResponse({'error': 'Pollutant record not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PollutantRecordSerializer(record)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([AllowAny])
def pollutant_record_update_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or any(p.id == 61 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            record = PollutantRecord.objects.get(pk=pk)
        except PollutantRecord.DoesNotExist:
            return JsonResponse({'error': 'Pollutant record not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PollutantRecordSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def pollutant_record_delete_view(request, pk):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=status.HTTP_400_BAD_REQUEST)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        current_user = jwt_auth.get_user(validated_token)

        permissions = get_user_permissions(current_user)
        if not (current_user.is_superuser or any(p.id == 62 for p in permissions)):
            return JsonResponse({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            record = PollutantRecord.objects.get(pk=pk)
        except PollutantRecord.DoesNotExist:
            return JsonResponse({'error': 'Pollutant record not found'}, status=status.HTTP_404_NOT_FOUND)

        record.delete()
        return JsonResponse({'message': 'Pollutant record deleted successfully'}, status=status.HTTP_204_NO_CONTENT, safe=False)
    except TokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


    







class CreateUserView(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        data['is_staff'] = False
        data['is_superuser'] = False
        data['username'] = data['email']

        # Download image from URL if present
        image_url = data.pop('image', None)
        serializer = UserSerializer(data=data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            if MyUser.objects.filter(email=email).exists():
                user = MyUser.objects.get(email=email)
                # Update user image if provided
                if image_url:
                    response = requests.get(image_url)
                    if response.status_code == 200:
                        user.image.save(f"{user.username}.jpg", ContentFile(response.content), save=True)
                return JsonResponse({'message': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
            user = serializer.save()
            # Save the image if URL is provided
            if image_url:
                response = requests.get(image_url)
                if response.status_code == 200:
                    user.image.save(f"{user.username}.jpg", ContentFile(response.content), save=True)
            return JsonResponse({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
def create_comment_view(request, record_id):
    try:
        Pollutant.objects.get(id=record_id)
    except Pollutant.DoesNotExist:
        return JsonResponse({'error': 'Pollutant record not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data.copy()
    data['user'] = MyUser.objects.get(email=data['user']).id
    data['pollutant'] = record_id
    serializer = CommentSerializer(data=data)

    if serializer.is_valid():
        serializer.save()
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_comments_view(request, record_id):
    try:
        record = Pollutant.objects.get(id=record_id)
    except Pollutant.DoesNotExist:
        return JsonResponse({'error': 'Pollutant record not found'}, status=status.HTTP_404_NOT_FOUND)

    comments = Comment.objects.filter(pollutant=record, parent=None)
    serializer = CommentSerializer(comments, many=True)
    return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)



