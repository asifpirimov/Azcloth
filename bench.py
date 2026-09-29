from django.db import connection
from apps.products.models import Product
print(f'Count: {Product.objects.count()}')
cursor=connection.cursor()
cursor.execute(\"EXPLAIN ANALYZE SELECT * FROM products_product WHERE name ILIKE '%test%' OR description ILIKE '%test%'\")
for row in cursor.fetchall(): print(row[0])
