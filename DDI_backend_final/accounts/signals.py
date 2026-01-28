# accounts/signals.py
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from .models import User, Roles
from patients.models import Patient
from prescriptions.models import Medication
from drugs.models import Drug
# accounts/signals.py (append)
from django.db.models.signals import post_save
from .utils import sync_user_group
from .models import User

@receiver(post_migrate)
def ensure_groups(sender, **kwargs):
    # Create groups
    groups = {
        Roles.ADMIN: Group.objects.get_or_create(name="ADMIN")[0],
        Roles.DOCTOR: Group.objects.get_or_create(name="DOCTOR")[0],
        Roles.PHARMACIST: Group.objects.get_or_create(name="PHARMACIST")[0],
    }

    # Basic permissions (customize as needed)
    patient_ct = ContentType.objects.get_for_model(Patient)
    med_ct = ContentType.objects.get_for_model(Medication)
    drug_ct = ContentType.objects.get_for_model(Drug)

    def add_perms(group, perms):
        for codename in perms:
            try:
                p = Permission.objects.get(codename=codename)
                group.permissions.add(p)
            except Permission.DoesNotExist:
                pass

    # Doctors: can add/view patients, medications
    add_perms(groups[Roles.DOCTOR], [
        "view_patient","add_patient","change_patient",
        "view_medication","add_medication","change_medication",
        "view_drug"
    ])

    # Pharmacists: view patients, manage meds, view/add drugs
    add_perms(groups[Roles.PHARMACIST], [
        "view_patient",
        "view_medication","add_medication","change_medication",
        "view_drug","add_drug"
    ])

    # Admins: manage professionals + patients in their hospital (enforced in views)
    add_perms(groups[Roles.ADMIN], [
        "view_patient","add_patient","change_patient",
        "view_medication","add_medication","change_medication",
        "view_drug","add_drug","change_drug",
    ])


@receiver(post_save, sender=User)
def assign_group(sender, instance, created, **kwargs):
    sync_user_group(instance)
