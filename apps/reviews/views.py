from django.shortcuts import redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from apps.products.models import Product
from apps.reviews.models import Comment

@login_required
def add_comment(request, product_id):
    if request.method == 'POST':
        product = get_object_or_404(Product, id=product_id)
        text = request.POST.get('text')
        if text:
            Comment.objects.create(product=product, user=request.user, text=text)
            messages.success(request, "Rəyiniz əlavə edildi.")
        return redirect('marketplace:product_detail', store_slug=product.store.slug, product_slug=product.slug)
    return redirect('marketplace:home')
