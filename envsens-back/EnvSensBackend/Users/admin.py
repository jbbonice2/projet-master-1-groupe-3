from django.contrib import admin
from Users.models import MyUser, MyGroup, MyGroupPermissions, MyPermission,Pollutant, PollutantRange, MyUserGroup,MyUserPermissions,City,Country,Network,Language,PollutantRecord, Gateway, Device

# Register your models here.
admin.site.register(MyUser)
admin.site.register(MyGroup)
admin.site.register(MyUserGroup)
admin.site.register(MyUserPermissions)
admin.site.register(MyGroupPermissions)
admin.site.register(MyPermission)
admin.site.register(Pollutant)
admin.site.register(PollutantRange)
admin.site.register(Network)
admin.site.register(Country)
admin.site.register(City)
admin.site.register(Language)
admin.site.register(PollutantRecord)
admin.site.register(Gateway)
admin.site.register(Device)





