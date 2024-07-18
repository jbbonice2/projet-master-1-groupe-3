def create_initial_permissions(apps, schema_editor):
    MyPermission = apps.get_model('Users', 'MyPermission')

    initial_permissions = [
    #     {"id": 1, "name": "Creer-utilisateur", "description": "Permission pour créer un compte utilisateur"},
    #     {"id": 2, "name": "Supprimer-utilisateur", "description": "Permission pour supprimer un compte utilisateur"},
    #     {"id": 3, "name": "Ajouter utilisateur-groupe", "description": "Permission pour ajouter un utilisateur à un groupe"},
    #     {"id": 4, "name": "Reinstaliser-mot_de_passe-utilisateur", "description": "Permission pour réinitialiser le mot de passe d'un utilisateur"},
    #     {"id": 5, "name": "Voir-utilisateurs", "description": "Permission pour voir la liste des utilisateurs"},
    #     {"id": 6, "name": "Retirer-utilisateur-groupe", "description": "Permission pour retirer un utilisateur dans un groupe"},
    #     {"id": 7, "name": "Retirer-permission-utilisateur", "description": "Permission pour retirer une permission à un utilisateur"},
    #     {"id": 8, "name": "Attribuer-permission-utilisateur", "description": "Permission pour attribuer une permission à un utilisateur"},
    #     {"id": 9, "name": "Attribuer-permission-groupe", "description": "Permission pour attribuer une permission à un groupe"},
    #     {"id": 10, "name": "Retirer-permission-groupe", "description": "Permission pour retirer une permission à un groupe"},
    #     {"id": 11, "name": "Voir-detail-utilisateur", "description": "Permission pour voir le profil d'un compte utilisateur"},
    #     {"id": 12, "name": "Voir-liste-groups-utilisateur", "description": "Permission pour voir la liste des groupes d'un utilisateur"},
    #     {"id": 13, "name": "Voir-liste-utilisateurs-groupe", "description": "Permission pour voir la liste des utilisateurs d'un groupe"},
    #     {"id": 14, "name": "Voir-liste-permissions-groupe", "description": "Permission pour voir la liste des permissions d'un groupe"},
    #     {"id": 15, "name": "Voir-liste-permissions-utilisateur", "description": "Permission pour voir la liste des permissions d'un utilisateur"},
    #     {"id": 16, "name": "Voir-detail-permissions", "description": "Permission pour voir les détails d'une permission"},
    #     {"id": 17, "name": "Voir-detail-groupe", "description": "Permission pour voir les détails d'un groupe"},
    #     {"id": 18, "name": "créer-groupe", "description": "Permission pour créer un groupe"},
    #     {"id": 19, "name": "Voir-liste-groupes", "description": "Permission pour voir la liste des groupes"},
    #     {"id": 20, "name": "Supprimer-groupe", "description": "Permission pour supprimer un groupe"},
    #     {"id": 21, "name": "creer polluant", "description": "Permission permattant de creer un polluant"},
    #     {"id": 22, "name": "mettre à jour polluant", "description": "Permission permettant de supprimer un polluant"},
    #     {"id": 23, "name": "Supprimer-polluant", "description": "Permission permettant de supprimer un polluant"},
    #     {"id": 24, "name": "Voir-polluant", "description": "Permission permettant de voir la liste despolluants"},
    #     {"id": 25, "name": "créer-pays", "description": "Permissions permettnt de creer un pays"},
    #     {"id": 26, "name": "mettre à jour pays", "description": "Permissions pour mettre à jour un pays"},
    #     {"id": 27, "name": "Supprimer-pays", "description": "permission permettant de supprimer un pays"},
    #     {"id": 28, "name": "Voir-Pays", "description": "Permission permettant de voir la liste des pays ou les details d'un pays"},
    #     {"id": 29, "name": "créer-langue", "description": ""},
    #     {"id": 30, "name": "mettre à jour langue", "description": "Permission permettant de de modifier une langue"},
    #     {"id": 31, "name": "Supprimer-langue", "description": "Permission permettant de supprimer une langue"},
    #     {"id": 32, "name": "Voir-Langue", "description": "Permission permettant de voir la liste des pays"},
    #     {"id": 33, "name": "créer-ville", "description": "Permissions donnant l'autorisation de creer une ville"},
    #     {"id": 34, "name": "mettre à jour ville", "description": "Permissions donnant l'autorisation de modifier une ville"},
    #     {"id": 35, "name": "Supprimer-ville", "description": "Permissions donnant l'autorisation de supprimer une ville"},
    #     {"id": 36, "name": "Voir-Villes", "description": "Permissions donnant l'autorisation de voir la liste des villes"},
    #     {"id": 37, "name": "creer-reseau", "description": "Permission autorisant la creation d'in reseau"},
    #     {"id": 38, "name": "mettre à jour reseau", "description": "Permission autorisant la mise à jour d'un reseau"},
    #     {"id": 39, "name": "Supprimer-reseau", "description": "Permission permettant la suppression d'un reseau"},
    #     {"id": 40, "name": "Voir-Reseau", "description": "Permissions permettant de voir les details d'un reseau"},
    #     {"id": 41, "name": "Voir-Reseaux", "description": "Permission permettant de voir la liste des resaux"},
    #     {"id": 42, "name": "Voir-Reseaux-Ville", "description": "Permission permettant de voir la liste des reseaux d'une ville."},

        
    #     {"id": 48, "name": "Voir_polluantRange", "description": "Permission permettant de voir les détails d'un polluantRange"},
    #     {"id": 49, "name": "créer-polluantRange", "description": "Permission pour créer un polluantRange"},
    #     {"id": 50, "name": "mettre à jour polluantRange", "description": "Permission pour mettre à jour un polluantRange"},
    #     {"id": 51, "name": "Supprimer-un-polluantRange", "description": "Permission pour supprimer un polluantRange"},
    #     {"id": 52, "name": "Voir_polluantRange-list", "description": "Permission permettant de voir la liste des polluantRange"},
    #     {"id": 53, "name": "Mettre à jour groupe", "description": "Permission permettant de mettre à jour un groupe"},
    #     {"id": 54, "name": "Mettre à jour un user", "description": "Permission permettant de mettre à jour les informations utilisateurs"},    
   

    #     # Permissions for Device (capteur)
    #     {"id": 53, "name": "Voir_device-list", "description": "Permission permettant de voir la liste des devices (capteurs)"},
    #     {"id": 54, "name": "Voir_device", "description": "Permission permettant de voir un device (capteur)"},
    #     {"id": 55, "name": "Créer_device", "description": "Permission permettant de créer un device (capteur)"},
    #     {"id": 56, "name": "Modifier_device", "description": "Permission permettant de modifier un device (capteur)"},
    #     {"id": 57, "name": "Supprimer_device", "description": "Permission permettant de supprimer un device (capteur)"},

    #     # Permissions for PolluantRecord
    #     {"id": 58, "name": "Voir_polluantRecord-list", "description": "Permission permettant de voir la liste des polluantRecords"},
    #     {"id": 59, "name": "Voir_polluantRecord", "description": "Permission permettant de voir un polluantRecord"},
    #     {"id": 60, "name": "Créer_polluantRecord", "description": "Permission permettant de créer un polluantRecord"},
    #     {"id": 61, "name": "Modifier_polluantRecord", "description": "Permission permettant de modifier un polluantRecord"},
    #     {"id": 62, "name": "Supprimer_polluantRecord", "description": "Permission permettant de supprimer un polluantRecord"},

    #     # Permissions pour les gateways
    #     {"id": 63, "name": "Voir_gateway-list", "description": "Permission permettant de voir la liste des gateways (passerelles)"},
    #     {"id": 64, "name": "Voir_gateway", "description": "Permission permettant de voir une gateway (passerelle)"},
    #     {"id": 65, "name": "Créer_gateway", "description": "Permission permettant de créer une gateway (passerelle)"},
    #     {"id": 66, "name": "Modifier_gateway", "description": "Permission permettant de modifier une gateway (passerelle)"},
    #     {"id": 67, "name": "Supprimer_gateway", "description": "Permission permettant de supprimer une gateway (passerelle)"},
        
    #     {"id": 69, "name": "Mettre à jour groupe", "description": "Permission permettant de mettre à jour un groupe"},
    #     {"id": 68, "name": "Mettre à jour un user", "description": "Permission permettant de mettre à jour les informations utilisateurs"},    
    #     {"id": 70, "name": "Voir_donnee capteur", "description": "Permission permettant de voir les donnes des capteurs"},
    #     {"id": 71, "name": "Voir_ville", "description": "Permission permettant de voir les details d'une ville"},
    #     {"id": 72, "name": "Voir_Detail_Polluant", "description": "Permission permettant de voir les details d'un polluant"},
    ]

    for permission in initial_permissions:
        MyPermission.objects.create(**permission)
