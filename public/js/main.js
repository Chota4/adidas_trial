// Cart functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add to cart buttons
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
        button.addEventListener('click', async (e) => {
            const productId = e.target.dataset.id;
            
            try {
                const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productId, quantity: 1 })
                });
                
                if (response.ok) {
                    alert('Product added to cart');
                    updateCartCount();
                } else {
                    const error = await response.json();
                    alert(error.message);
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Failed to add to cart');
            }
        });
    });

    // Update cart count
    async function updateCartCount() {
        try {
            const response = await fetch('/api/cart/count');
            if (response.ok) {
                const { count } = await response.json();
                const cartCount = document.getElementById('cart-count');
                if (cartCount) {
                    cartCount.textContent = count;
                }
            }
        } catch (err) {
            console.error('Error fetching cart count:', err);
        }
    }

    // Initialize cart count
    updateCartCount();
});

// Image preview for uploads
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
    }

    if (file) {
        reader.readAsDataURL(file);
    }
}