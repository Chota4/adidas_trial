const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

// @desc    Get all products
// @route   GET /products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate('user', 'name email');
        res.render('products/index', { 
            title: 'All Products',
            products 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Server Error',
            error: 'Failed to load products' 
        });
    }
};

// @desc    Get single product
// @route   GET /products/:id
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('user', 'name email');
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/products');
        }
        res.render('products/show', { 
            title: product.name,
            product 
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server Error');
        res.redirect('/products');
    }
};

// @desc    Show creation form
// @route   GET /admin/products/new
exports.showNewProductForm = (req, res) => {
    res.render('products/admin/new', { 
        title: 'Add New Product',
        product: null,
        brands: ['Adidas', 'Nike', 'Puma', 'Reebok'], // Example brands
        categories: ['Shoes', 'Clothing', 'Accessories'] // Example categories
    });
};

// @desc    Create product
// @route   POST /admin/products
exports.createProduct = async (req, res) => {
    try {
        const { name, price, description, brand, category, countInStock } = req.body;
        
        // Validate required image
        if (!req.file) {
            req.flash('error', 'Product image is required');
            return res.redirect('/admin/products/new');
        }

        // Create product with Cloudinary image data
        const product = new Product({
            name,
            price: parseFloat(price),
            description,
            image: {
                url: req.file.path,
                publicId: req.file.filename
            },
            brand: brand || 'Adidas',
            category,
            countInStock: parseInt(countInStock),
            user: req.user._id
        });

        await product.save();
        req.flash('success', 'Product created successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        
        // Cleanup uploaded image if creation fails
        if (req.file) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (cloudinaryErr) {
                console.error('Cloudinary cleanup failed:', cloudinaryErr);
            }
        }

        req.flash('error', err.message || 'Failed to create product');
        res.redirect('/admin/products/new');
    }
};

// @desc    Show edit form
// @route   GET /admin/products/:id/edit
exports.showEditProductForm = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        res.render('products/admin/edit', { 
            title: 'Edit Product',
            product,
            brands: ['Adidas', 'Nike', 'Puma', 'Reebok'],
            categories: ['Shoes', 'Clothing', 'Accessories']
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server Error');
        res.redirect('/admin/products');
    }
};

// @desc    Update product
// @route   PUT /admin/products/:id
exports.updateProduct = async (req, res) => {
    try {
        const { name, price, description, brand, category, countInStock } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Update product fields
        product.name = name;
        product.price = parseFloat(price);
        product.description = description;
        product.brand = brand;
        product.category = category;
        product.countInStock = parseInt(countInStock);

        // Handle image update if new file uploaded
        if (req.file) {
            // Delete old image from Cloudinary
            if (product.image.publicId) {
                try {
                    await cloudinary.uploader.destroy(product.image.publicId);
                } catch (cloudinaryErr) {
                    console.error('Failed to delete old image:', cloudinaryErr);
                }
            }
            
            // Set new image
            product.image = {
                url: req.file.path,
                publicId: req.file.filename
            };
        }

        await product.save();
        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        
        // Cleanup new image if update failed
        if (req.file) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (cloudinaryErr) {
                console.error('Cloudinary cleanup failed:', cloudinaryErr);
            }
        }

        req.flash('error', err.message || 'Failed to update product');
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
};

// @desc    Delete product
// @route   DELETE /admin/products/:id
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Delete image from Cloudinary
        if (product.image.publicId) {
            try {
                await cloudinary.uploader.destroy(product.image.publicId);
            } catch (cloudinaryErr) {
                console.error('Failed to delete image:', cloudinaryErr);
            }
        }

        await product.remove();
        req.flash('success', 'Product deleted successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message || 'Failed to delete product');
        res.redirect('/admin/products');
    }
};