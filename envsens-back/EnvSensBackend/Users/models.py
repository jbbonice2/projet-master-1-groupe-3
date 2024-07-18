from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.gis.db import models as geomodels

class MyAbstractModel(models.Model):
    created_at = models.DateTimeField(_('created_at'), auto_now_add=True, null=True)
    edited_at = models.DateTimeField(_('edited_at'), auto_now=True, )
    created_by = models.CharField(max_length=150, blank=True, null=True)
    edited_by = models.CharField(max_length=150, blank=True, null=True)
    
    class Meta:
        abstract = True

    def __str__(self):
        return "Model abstrait"





class MyUser(MyAbstractModel, AbstractUser):
    username = models.CharField(unique=True, max_length=100)
    image = models.ImageField(upload_to='user_images', blank=True, null=True)
    active = models.BooleanField(default=True)


    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username


class MyPermission(MyAbstractModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return "{} - {} - {}".format(self.pk, self.name, self.description)


class MyGroup(MyAbstractModel):
    code = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.label


class MyUserPermissions(MyAbstractModel):
    user = models.ForeignKey(
        MyUser, 
        on_delete=models.CASCADE, 
        related_name='user_permissions_set'
    )
    permission = models.ForeignKey(
        MyPermission, 
        on_delete=models.CASCADE, 
        related_name='permission_user_set'
    )

    def __str__(self):
        return f"{self.user.username} - {self.permission.name}"



class MyGroupPermissions(MyAbstractModel):
    group = models.ForeignKey(
        MyGroup, 
        on_delete=models.CASCADE, 
        related_name='group_permissions_set'
    )
    permission = models.ForeignKey(
        MyPermission, 
        on_delete=models.CASCADE, 
        related_name='permission_group_set'
    )
    def __str__(self):
        return f"{self.group.label} - {self.permission.name}"


class MyUserGroup(MyAbstractModel):
    user = models.ForeignKey(
        MyUser, 
        on_delete=models.CASCADE, 
        related_name='user_groups_set'
    )
    group = models.ForeignKey(
        MyGroup, 
        on_delete=models.CASCADE, 
        related_name='group_user_set'
    )
    def __str__(self):
        return f"{self.user.username} - {self.group.label}"



class Pollutant(MyAbstractModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    unit = models.CharField(max_length=50, default='ppm')

    def __str__(self):
        return self.name

class PollutantRange(MyAbstractModel):
    pollutant = models.ForeignKey(Pollutant, related_name='ranges', on_delete=models.CASCADE)
    minValue = models.FloatField()
    maxValue = models.FloatField()
    isMaxValueInclude = models.BooleanField(default=False)
    quality = models.CharField(max_length=100)
    display_color = models.CharField(max_length=20)  # Assuming hexadecimal color code

    def __str__(self):
        return f"Range for {self.pollutant.name}: {self.minValue} to {self.maxValue}"







class Country(MyAbstractModel):
    code = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name
    

class Language(MyAbstractModel):
    label = models.CharField(max_length=500)
    code = models.CharField(max_length=500, unique=True)

    def __str__(self):
        return self.label



class City(MyAbstractModel):
    label = models.CharField(max_length=500)
    code = models.CharField(max_length=500, unique=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.label





class Network(MyAbstractModel):
    name = models.CharField(max_length=500)
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

class Gateway(MyAbstractModel):
    description = models.CharField(max_length=255)
    location = geomodels.PointField()  
    location_name = models.CharField(max_length=100)
    location_description = models.TextField()
    network  = models.ForeignKey(Network, on_delete=models.CASCADE, null=False)
    gwId = models.CharField(max_length=100, unique=True)

    class Meta:
        unique_together = ('network_id', 'gwId')

    def __str__(self):
        return self.description





class Device(MyAbstractModel):
    address = models.CharField(max_length=255)
    description = models.TextField()
    location = geomodels.PointField()  # Utilisation de PointField pour les coordonnées géographiques
    location_name = models.CharField(max_length=255)
    location_description = models.TextField()
    network_session_key = models.CharField(max_length=255)
    application_session_key = models.CharField(max_length=255)
    is_mobile = models.BooleanField(default=False)
    network = models.ForeignKey(Network, on_delete=models.CASCADE)
    geteway = models.ForeignKey(Gateway, on_delete=models.CASCADE)
    dev_id = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return f"{self.dev_id} - {self.id}"




from django.utils import timezone

class PollutantRecord(models.Model):
    sequence_number = models.IntegerField()
    location = geomodels.PointField()
    value = models.FloatField()
    reception_date = models.DateTimeField()
    endDevice_id = models.ForeignKey(Device, on_delete=models.CASCADE, default=None, null=True, blank=True)
    pollutant_id =  models.ForeignKey(Pollutant, on_delete=models.CASCADE, default=None,  null=True, blank=True)
    gateway_id =  models.ForeignKey(Gateway, on_delete=models.CASCADE, default=None, null=True, blank=True)
    timestamp_device = models.DateTimeField(default=timezone.now)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PollutantRecord {self.sequence_number}"

class Message(models.Model):
    user = models.EmailField()
    name = models.CharField(max_length=100)
    recipient = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=200)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_replied = models.BooleanField(default=False)




class Comment(models.Model):
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    pollutant = models.ForeignKey(Pollutant, on_delete=models.CASCADE)
    content = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.user.username} - {self.content[:20]}'

    class Meta:
        ordering = ['timestamp']

