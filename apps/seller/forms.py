from django import forms
from apps.stores.models import Store
from apps.products.models import Product, ProductVariant
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class StoreClaimForm(forms.ModelForm):
    class Meta:
        model = Store
        fields = [
            'name', 'slug', 'description', 'phone', 'whatsapp_number',
            'address', 'instagram_url', 'tiktok_url', 'theme', 'logo', 'cover_image'
        ]

class SellerRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, label=_("Şifrə"))
    password_confirmation = forms.CharField(widget=forms.PasswordInput, label=_("Şifrənin təsdiqi"))

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError(_("Bu e-poçt artıq istifadə olunur."))
        return email

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirmation = cleaned_data.get('password_confirmation')
        if password and password_confirmation and password != password_confirmation:
            self.add_error('password_confirmation', _("Şifrələr uyğun gəlmir."))
        return cleaned_data


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'slug', 'description', 'category', 'brand', 'main_image', 'status']

class ProductVariantForm(forms.ModelForm):
    class Meta:
        model = ProductVariant
        fields = ['sku', 'size', 'color', 'price', 'stock']

