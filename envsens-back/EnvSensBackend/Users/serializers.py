from rest_framework import serializers
from .models import Device, Message, MyUser, MyGroup, MyPermission, PollutantRange, MyUserPermissions, MyGroupPermissions, MyUserGroup, PollutantRecord
from .models import Language, MyUser, MyGroup, MyPermission, MyUserPermissions, MyGroupPermissions, MyUserGroup, Country, City, Network,Pollutant,Gateway
from .models import Comment
from django.contrib.gis.geos import Point


class MyUserSerializer(serializers.ModelSerializer):
    permissions_count = serializers.SerializerMethodField()
    groups_count = serializers.SerializerMethodField()
    img_url = serializers.SerializerMethodField()

    class Meta:
        model = MyUser
        fields = ['id', 'username','last_name', "last_login", 'first_name', 'email', 'image', 'active', 'created_at', 'edited_at', 'created_by', 'edited_by', 'permissions_count', 'groups_count', 'img_url', 'is_superuser']

    def get_permissions_count(self, obj):
        return MyUserPermissions.objects.filter(user=obj).count()

    def get_groups_count(self, obj):
        return MyUserGroup.objects.filter(user=obj).count()
    
    def get_img_url(self, obj):
        if obj.image:
            return obj.image.url
        else:
            return ""


class MyPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyPermission
        fields = ['id', 'name', 'description', 'active', 'created_at', 'edited_at', 'created_by', 'edited_by']


class MyGroupSerializer(serializers.ModelSerializer):
    users_count = serializers.SerializerMethodField()
    permissions_count = serializers.SerializerMethodField()

    class Meta:
        model = MyGroup
        fields = ['id', 'code', 'label', 'description', 'active', 'created_at', 'edited_at', 'created_by', 'edited_by', 'users_count', 'permissions_count']

    def get_users_count(self, obj):
        return MyUserGroup.objects.filter(group=obj).count()

    def get_permissions_count(self, obj):
        return MyGroupPermissions.objects.filter(group=obj).count()


class MyUserPermissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyUserPermissions
        fields = ['id', 'user', 'permission', 'created_at', 'edited_at', 'created_by', 'edited_by']


class MyGroupPermissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyGroupPermissions
        fields = ['id', 'group', 'permission', 'created_at', 'edited_at', 'created_by', 'edited_by']


class MyUserGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyUserGroup
        fields = ['id', 'user', 'group', 'created_at', 'edited_at', 'created_by', 'edited_by']


class PollutantRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollutantRange
        fields = ['id', 'minValue', 'maxValue', 'isMaxValueInclude', 'quality', 'pollutant_id', 'display_color', 'created_at', 'edited_at', 'created_by', 'edited_by']

class PollutantSerializer(serializers.ModelSerializer):
    ranges = PollutantRangeSerializer(many=True, read_only=True)

    class Meta:
        model = Pollutant
        fields = ['id', 'code', 'name', 'description', 'unit', 'ranges', 'created_at', 'edited_at', 'created_by', 'edited_by']

class GatewaySerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    network_name = serializers.SerializerMethodField()
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    latitude_read = serializers.SerializerMethodField()
    longitude_read = serializers.SerializerMethodField()


    class Meta:
        model = Gateway
        fields = ['id','description','location_name','location_description','network','gwId',
                  'created_at', 'edited_at', 'created_by', 'edited_by','network_name',
                  'latitude_read', 'longitude_read','latitude', 'longitude' ]
        read_only_fields = ['latitude_read', 'longitude_read', 'id',]

    
    
    def get_network_name(self, obj):
        return obj.network.name if obj.network.name else ""

    def get_latitude_read(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude_read(self, obj):
        return obj.location.x if obj.location else None

    def create(self, validated_data):
        latitude = validated_data.pop('latitude')
        longitude = validated_data.pop('longitude')
        location = Point(longitude, latitude)
        validated_data['location'] = location
        return Gateway.objects.create(**validated_data)
    

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = '__all__'


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'


class CitySerializer(serializers.ModelSerializer):
    country_id = serializers.IntegerField(write_only=True)
    country = serializers.StringRelatedField()
    num_networks = serializers.SerializerMethodField()

    class Meta:
        model = City
        fields = ['id', 'label', 'code', 'country','country_id',  'description', 'num_networks', 'created_at', 'edited_at', 'created_by', 'edited_by']

    def get_num_networks(self, obj):
        return Network.objects.filter(city=obj).count()
    
    def create(self, validated_data):
        country = Country.objects.get(pk=validated_data.pop('country_id'))
        validated_data['country'] = country
        return City.objects.create(**validated_data)



class NetworkSerializer(serializers.ModelSerializer):
    num_devices = serializers.SerializerMethodField()
    num_gateways = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    city_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Network
        fields = ['id', 'name', 'city', 'city_id', 'description', 'num_devices', 'num_gateways', 'created_at', 'edited_at', 'created_by', 'edited_by',]

    def get_num_devices(self, obj):
        return Device.objects.filter(network=obj).count()

    def get_num_gateways(self, obj):
        return Gateway.objects.filter(network=obj).count()
    
    def get_city(self, obj):
        return obj.city.label if obj.city else ""
    
    def create(self, validated_data):
        city = City.objects.get(pk=validated_data.pop('city_id'))
        validated_data['city'] = city
        return Network.objects.create(**validated_data)


class DeviceSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    geteway_id = serializers.FloatField(write_only=True)
    latitude_read = serializers.SerializerMethodField()
    longitude_read = serializers.SerializerMethodField()
    geteway = serializers.StringRelatedField()

    class Meta:
        model = Device
        fields = ['dev_id', 'network', 'is_mobile', 'application_session_key', 'network_session_key', 
                  'latitude', 'longitude', 'location_description', 'location_name', 'description', 
                  'address', 'geteway', 'latitude_read', 'longitude_read','geteway_id', 'id', 'created_at', 'edited_at', 'created_by', 'edited_by',]
        read_only_fields = ['latitude_read', 'longitude_read', 'id',]

    def get_latitude_read(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude_read(self, obj):
        return obj.location.x if obj.location else None

    def create(self, validated_data):
        latitude = validated_data.pop('latitude')
        longitude = validated_data.pop('longitude')
        location = Point(longitude, latitude)
        validated_data['location'] = location
        return Device.objects.create(**validated_data)



class PollutantRecordSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    latitude_read = serializers.SerializerMethodField()
    longitude_read = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PollutantRecord
        fields = ['sequence_number', 'value','name',  'reception_date', 'endDevice_id', 'pollutant_id', 'gateway_id',
                  'latitude', 'longitude', 'timestamp_device', 'timestamp', 'latitude_read', 'longitude_read', 'id']
        read_only_fields = ['latitude_read', 'longitude_read', 'timestamp', 'id']

    def get_latitude_read(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude_read(self, obj):
        return obj.location.x if obj.location else None
    
    def get_name(self, obj):
        return obj.pollutant_id.name if obj.pollutant_id else " Unknown"

    def create(self, validated_data):
        latitude = validated_data.pop('latitude')
        longitude = validated_data.pop('longitude')
        location = Point(longitude, latitude)
        validated_data['location'] = location
        return PollutantRecord.objects.create(**validated_data)

    def update(self, instance, validated_data):
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        if latitude and longitude:
            instance.location = Point(longitude, latitude)
        return super().update(instance, validated_data)

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'user', 'name', 'recipient', 'subject', 'body', 'created_at', 'is_replied']



class NestedPollutantRecordSerializer(serializers.Serializer):
    gwid = serializers.IntegerField()
    longitude = serializers.FloatField()
    latitude = serializers.FloatField()
    data = serializers.ListField(child=serializers.DictField())










class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyUser
        fields = ['username', 'email', 'first_name', 'last_name', 'image']
        extra_kwargs = {'email': {'required': True}}

    def create(self, validated_data):
        user = MyUser(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            active = False
        )
        user.set_unusable_password()
        user.save()
        return user



class CommentSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField()
    user_inf = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'pollutant', 'user_inf', 'content', 'timestamp', 'parent', 'replies']

    def get_replies(self, obj):
        replies = Comment.objects.filter(parent=obj)
        return CommentSerializer(replies, many=True).data
    
    def get_user_inf(self, obj):
        return {'username': obj.user.username, 'email': obj.user.email, 'url_img': obj.user.image.url, 'is_superuser': obj.user.is_superuser}