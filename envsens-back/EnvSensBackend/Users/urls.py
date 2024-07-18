from django.urls import path
from .views import *
from .views import send_message
from .groupsViews import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .additionnalsViews import (
    create_comment_view, create_country_view, create_network_view, delete_network_view, get_comments_view, get_network_view, update_country_view, delete_country_view, list_countries_view,
    create_language_view, update_language_view, delete_language_view, list_languages_view,
    list_cities_view, create_city_view, update_city_view, delete_city_view, city_details_view, country_details_view, update_network_view, 
    list_networks_view, city_networks_view,
    device_list_view, device_create_view, device_detail_view, device_update_view, device_delete_view, list_gateway_networks_view, list_netwok_devices_list,
    pollutant_record_list_view,    pollutant_record_create_view,    pollutant_record_detail_view,    pollutant_record_update_view,    pollutant_record_delete_view,
    CreateUserView
)

urlpatterns = [
    #urls pour la gestion des utilisateurs 
    path('users/login/', user_login_view, name='user_login'),
    path('users/token/verify/', verify_token, name='verify_token'),
    path('users/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('users/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/register/', create_user_view, name='create_user'),
    path('users/list/', user_list_view, name='user_list'),
    path('users/forget_password/',  forget_password_view, name='forget_password'),
     path('users/verify_code_and_reset_password/',  verify_code_and_reset_password_view, name='verify_code_and_reset_password'),
    path('users/delete/<int:user_id>/', delete_user_view, name='user_info'),
    path('users/update/<int:user_id>/', update_user_view, name='update_user'),
    path('users/logout/', logout_user_view, name='logout_user'),
    path('users/change-password/', change_password_view, name='change_password'),
    path('users/<int:user_id>/', user_detail_view, name='user_detail_view'), 
    path('users/remove/user/<int:user_id>/permission/<int:permission_id>/', remove_permission_from_user_view, name='remove_permission_from_user'),
    path('users/list_user_permissions/user/<int:user_id>/', list_user_permissions_view, name='list_user_permissions'),
    path('users/reset_password/user/<int:user_id>/', reset_password_view, name='reset_password'),
    path('users/forget_password/user/<int:user_id>/', forget_password_view, name='forget_password'),
    path('users/list_user_non_permissions/user/<int:user_id>/', list_user_non_permissions_view, name='list_user_non_permissions'),
    path('permissions/add_users_permission/<int:permission_id>/', add_users_to_permission_view, name='add_users_to_permission'),
    path('users/add_permissions_to_user/<int:user_id>/', add_permissions_to_user_view, name='add_permissions_to_user'),
    path('users/update_profile_picture/', UpdateProfilePicture_view.as_view(), name='update_profile_picture'),
    path('users/delete_profile_picture/', delete_profile_picture_view, name='delete_profile_picture'),
   
    #urls pour la gestion des des groupes
    path('groups/create/', create_group_view, name='create_group'),
    path('groups/update/<int:id>/', update_group_view, name='update_group'),
    path('groups/delete/<int:id>/', delete_group_view, name='delete_group'),
    path('groups/detail/<int:group_id>/', group_detail_view, name='group_detail'),
    path('groups/list/', group_list_view, name='group_list'),
    path('groups/delete_user_to_group/group/<int:group_id>/user/<int:user_id>/', delete_user_from_group_view, name='delete_user_from_group'),
    path('groups/list_users_in_group/group/<int:group_id>/', list_users_in_group_view, name='list_users_in_group'),
    path('groups/list_groups_of_user/user/<int:user_id>/', list_groups_of_user_view, name='list_groups_of_user'),
    path('groups/remove/group/<int:group_id>/permission/<int:permission_id>/', remove_permission_from_group_view, name='remove_permission_from_group'),
    path('permissions/list/', permission_list_view, name='permission_list'),
    path('groups/list_group_permissions/group/<int:group_id>/', list_group_permissions_view, name='list_group_permissions'),
    path('users/add_groups_to_user/<int:user_id>/', add_groups_to_user_view, name='add_groups_to_user'),
    path('groups/add_users_to_group/<int:group_id>/', add_users_to_group_view, name='add_users_to_group'),
    path('groups/add_permissions_to_group/<int:group_id>/', add_permissions_to_group_view, name='add_permissions_to_group'),
    path('permissions/add_groups_to_permission/<int:permission_id>/', add_groups_to_permission_view, name='add_groups_to_permission'),
    path('groups/list_group_non_users/<int:group_id>/', list_group_non_users_view, name='list_group_non_users'),
    path('users/list_user_non_groups/<int:user_id>/', list_user_non_groups_view, name='list_user_non_groups'),
      
    path('admins/pollutants/create/', pollutant_create_view, name='pollutant-create'),
    path('admins/pollutants/update/<int:id>/', pollutant_update_view, name='pollutant-update'),
    path('admins/pollutants/delete/<int:id>/', pollutant_delete_view, name='pollutant-delete'),
    path('admins/pollutants/list/', pollutant_list_view, name='pollutant-list'),
    path('admins/pollutants/create_polluant_range/<int:id>/ranges/', add_pollutant_range_view, name='add-pollutant-range'),
    path('admins/pollutants/update_polluant_range/<int:id>/ranges/<int:range_id>/', update_pollutant_range_view, name='update-pollutant-range'),
    path('admins/pollutants/list_polluant_range/<int:id>/', get_pollutant_detail_view, name='get-pollutant-detail'),
    path('admins/pollutants/delete_polluant_range/<int:id>/ranges/<int:range_id>/', delete_pollutant_range_view, name='delete-pollutant-range'),
    path('admins/pollutants/detail_polluant_range/<int:id>/ranges/<int:range_id>/', get_pollutant_range_detail_view, name='get-pollutant-range-detail'),

    path('admins/gateways/create/', create_gateway_view, name='create_gateway'),
    path('admins/gateways/update_gateway/<int:pk>/', update_gateway_view, name='update_gateway'),
    path('admins/gateways/delete/<int:pk>/', delete_gateway_view, name='delete_gateway'),
    path('admins/gateways/list/', list_gateways_view, name='list_gateways'),
    path('admins/gateways/details/<int:gateway_id>/', gateway_detail_view, name='gateway-detail'),

    path('country/', create_country_view, name='create_country'),
    path('country/<int:pk>/', update_country_view, name='update_country'),
    path('country/<int:pk>/delete/', delete_country_view, name='delete_country'),
    path('countries/', list_countries_view, name='list_countries'),
    path('country/details/<int:pk>/', country_details_view, name='delete_city'),

    path('language/', create_language_view, name='create_language'),
    path('language/<int:pk>/', update_language_view, name='update_language'),
    path('language/<int:pk>/delete/', delete_language_view, name='delete_language'),
    path('languages/', list_languages_view, name='list_languages'),

    path('cities/', list_cities_view, name='list_cities'),
    path('cities/create/', create_city_view, name='create_city'),
    path('cities/update/<int:pk>/', update_city_view, name='update_city'),
    path('cities/delete/<int:pk>/', delete_city_view, name='delete_city'),
    path('city/details/<int:pk>/', city_details_view, name='delete_city'),
    path('city/<int:id>/networks/', city_networks_view, name='delete_city'),



    path('networks/create/', create_network_view, name='create_network'),
    path('networks/<int:pk>/', get_network_view, name='get_network'),
    path('networks/update/<int:pk>/', update_network_view, name='update_network'),
    path('networks/delete/<int:pk>/', delete_network_view, name='delete_network'),
    path('networks/', list_networks_view, name='list_networks'),
    path('network/<int:pk>/gateways/', list_gateway_networks_view, name='list_gateway_networks'),
    path('network/<int:pk>/devices/', list_netwok_devices_list, name='list_devices_networks'),




    path('devices/', device_list_view, name='device-list'),
    path('devices/create/', device_create_view, name='device-create'),
    path('devices/details/<int:pk>/', device_detail_view, name='device-detail'),
    path('devices/update/<int:pk>/', device_update_view, name='device-update'),
    path('devices/delete/<int:pk>/', device_delete_view, name='device-delete'),



    path('pollutant-records/', pollutant_record_list_view, name='pollutant-record-list'),
    path('pollutant-records/create/', pollutant_record_create_view, name='pollutant-record-create'),
    path('pollutant-records/<int:pk>/', pollutant_record_detail_view, name='pollutant-record-detail'),
    path('pollutant-records/<int:pk>/update/', pollutant_record_update_view, name='pollutant-record-update'),
    path('pollutant-records/<int:pk>/delete/', pollutant_record_delete_view, name='pollutant-record-delete'),

    path('pollutant-record-months/', get_pollutant_record_months, name='pollutant-record-months'),
   path('pollutant-records/<int:year>/<int:month>/', get_pollutant_records_by_month, name='pollutant-records-by-month'),


    path('admins/send_message/', send_message, name='send_message'),


    path('users/create', CreateUserView.as_view(), name='create-user'),


    path('comments/create/<int:record_id>/', create_comment_view, name='comment-creation-view'),
    path('comments/<int:record_id>/', get_comments_view, name='create-comment'),
    
]

