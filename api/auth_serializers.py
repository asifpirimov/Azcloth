from rest_framework import serializers
from apps.accounts.models import User
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    store_slug = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'store_slug']

    def get_store_slug(self, obj):
        if obj.role == 'SELLER':
            store = obj.stores.filter(status='ACTIVE').first()
            if store:
                return store.slug
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=User.ROLE_BUYER
        )
        return user

class StoreRegisterSerializer(serializers.ModelSerializer):
    token = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'token']

    def create(self, validated_data):
        # We will handle the token logic inside the view, here we just create the user as SELLER
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=User.ROLE_SELLER
        )
        return user
