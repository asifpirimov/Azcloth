from django.shortcuts import render, get_object_or_404
from django.views import View
from django.db.models import Q
from apps.products.models import Product, Category
from apps.stores.models import Store

class HomeView(View):
    def get(self, request):
        # Only ACTIVE stores and PUBLISHED products
        products = Product.objects.filter(status=Product.STATUS_PUBLISHED, store__status=Store.STATUS_ACTIVE).order_by('-created_at')[:8]
        stores = Store.objects.filter(status=Store.STATUS_ACTIVE).order_by('-created_at')[:4]
        categories = Category.objects.all()
        return render(request, 'marketplace/home.html', {
            'products': products,
            'stores': stores,
            'categories': categories
        })

class ProductListView(View):
    def get(self, request):
        query = request.GET.get('q', '')
        category_slug = request.GET.get('category', '')
        store_slug = request.GET.get('store', '')
        
        products = Product.objects.filter(status=Product.STATUS_PUBLISHED, store__status=Store.STATUS_ACTIVE)
        
        if query:
            products = products.filter(Q(name__icontains=query) | Q(description__icontains=query))
        if category_slug:
            products = products.filter(category__slug=category_slug)
        if store_slug:
            products = products.filter(store__slug=store_slug)
            
        return render(request, 'marketplace/product_list.html', {
            'products': products,
            'query': query
        })

class ProductDetailView(View):
    def get(self, request, store_slug, product_slug):
        product = get_object_or_404(Product, slug=product_slug, store__slug=store_slug, status=Product.STATUS_PUBLISHED, store__status=Store.STATUS_ACTIVE)
        variants = product.variants.all()
        wholesale_tiers = product.wholesale_tiers.all()
        return render(request, 'marketplace/product_detail.html', {
            'product': product,
            'variants': variants,
            'wholesale_tiers': wholesale_tiers,
            'store': product.store
        })

class StoreDetailView(View):
    def get(self, request, slug):
        store = get_object_or_404(Store, slug=slug, status=Store.STATUS_ACTIVE)
        products = store.products.filter(status=Product.STATUS_PUBLISHED)
        return render(request, f'marketplace/store_theme_{store.theme}.html', {
            'store': store,
            'products': products
        })

class CartView(View):
    def get(self, request):
        # Cart logic is mostly in JS (localStorage)
        return render(request, 'marketplace/cart.html')
