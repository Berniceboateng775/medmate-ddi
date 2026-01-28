# accounts/utils.py
from django.contrib.auth.models import Group
from .models import Roles

def sync_user_group(user):
    role_to_group = {
        Roles.ADMIN: "ADMIN",
        Roles.DOCTOR: "DOCTOR",
        Roles.PHARMACIST: "PHARMACIST",
    }
    for g in user.groups.all():
        user.groups.remove(g)
    gname = role_to_group.get(user.role)
    if gname:
        group = Group.objects.get(name=gname)
        user.groups.add(group)
