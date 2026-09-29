import os
import django
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.stores.models import Store
from apps.products.models import Category, Product, ProductVariant

# Clear existing data
Category.objects.all().delete()
Store.objects.all().delete()
User.objects.all().delete()

# Create user
user = User.objects.create_user(username='seller1', email='seller@azcloth.com', password='password123', role=User.ROLE_SELLER)

# Create store
store = Store.objects.create(owner=user, name='ATELYE BAKI', description='Yerli kətan və yun məhsulları', slug='atelye-baki', status='ACTIVE', whatsapp_number='+994501234567')
store2 = Store.objects.create(owner=user, name='BAKU CHIC', description='Zərif ipək donlar', slug='baku-chic', status='ACTIVE', whatsapp_number='+994551234567')

# Create categories
cat_ketan = Category.objects.create(name='Təbii Kətan', slug='tebii-ketan')
cat_kostyum = Category.objects.create(name='Kostyumlar', slug='kostyumlar')
cat_don = Category.objects.create(name='Donlar', slug='donlar')

# Create products
p1 = Product.objects.create(
    store=store, category=cat_ketan, name='Göz göy kətan köynək', slug='goz-goy-ketan-koynek',
    description='100% təbii kətan köynək.', status='PUBLISHED'
)
ProductVariant.objects.create(product=p1, size='S', stock=100, price=89.00)
ProductVariant.objects.create(product=p1, size='M', stock=300, price=89.00)
ProductVariant.objects.create(product=p1, size='L', stock=380, price=89.00)

p2 = Product.objects.create(
    store=store, category=cat_kostyum, name='Standart Yun Kostyum', slug='standart-yun-kostyum',
    description='Premium yun kostyum.', status='PUBLISHED'
)
ProductVariant.objects.create(product=p2, size='48', stock=5, price=185.00)
ProductVariant.objects.create(product=p2, size='50', stock=10, price=185.00)
ProductVariant.objects.create(product=p2, size='52', stock=5, price=185.00)

p3 = Product.objects.create(
    store=store, category=cat_kostyum, name='Klassik payız trençkotu', slug='klassik-payiz-trenckotu',
    description='Dəbli payız trençkotu.', status='PUBLISHED'
)
ProductVariant.objects.create(product=p3, size='S', stock=2, price=185.00)
ProductVariant.objects.create(product=p3, size='M', stock=5, price=185.00)

p4 = Product.objects.create(
    store=store2, category=cat_don, name='Zümrüd Yaşılı Ziyafət Donu', slug='zumrud-yasili-ziyafet-donu',
    description='Zərif ipək ziyafət donu.', status='PUBLISHED'
)
ProductVariant.objects.create(product=p4, size='S', stock=5, price=240.00)
ProductVariant.objects.create(product=p4, size='M', stock=12, price=240.00)

print("Mock data seeded successfully!")
