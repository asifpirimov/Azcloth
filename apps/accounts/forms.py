from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class BuyerRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, label=_("Şifrə"))
    password_confirmation = forms.CharField(widget=forms.PasswordInput, label=_("Şifrənin təsdiqi"))

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']
        labels = {
            'first_name': _("Ad"),
            'last_name': _("Soyad"),
            'email': _("E-poçt"),
        }

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

class OTPVerificationForm(forms.Form):
    otp = forms.CharField(max_length=6, label=_("Təsdiq kodu"))
