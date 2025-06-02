const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('products/index', { 
            title: 'All Products',
            products 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Server Error',
            error: 'Server Error' 
        });
    }
};

// @desc    Get single product
// @route   GET /products/:id
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                error: 'Product not found' 
            });
        }
        res.render('products/show', { 
            title: product.name,
            product 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Server Error',
            error: 'Server Error' 
        });
    }
};

// @desc    Show product creation form
// @route   GET /admin/products/new
exports.showNewProductForm = (req, res) => {
    res.render('products/admin/new', { 
        title: 'Add New Product' 
    });
};

// @desc    Create new product
// @route   POST /admin/products
exports.createProduct = async (req, res) => {
    try {
        const { name, price, description, brand, category, countInStock } = req.body;
        const image = req.file ? req.file.path : '/images/products/default.jpg';
        
        const product = new Product({
            name,
            price,
            description,
            image,
            brand,
            category,
            countInStock,
            user: req.user._id
        });

        await product.save();
        req.flash('success', 'Product created successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to create product');
        res.redirect('/admin/products/new');
    }
};

// @desc    Show product edit form
// @route   GET /admin/products/:id/edit
exports.showEditProductForm = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                error: 'Product not found' 
            });
        }
        res.render('products/admin/edit', { 
            title: 'Edit Product',
            product 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Server Error',
            error: 'Server Error' 
        });
    }
};

// @desc    Update product
// @route   PUT /admin/products/:id
exports.updateProduct = async (req, res) => {
    try {
        const { name, price, description, brand, category, countInStock } = req.body;
        let image;
        
        if (req.file) {
            image = req.file.path;
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                error: 'Product not found' 
            });
        }

        product.name = name;
        product.price = price;
        product.description = description;
        product.brand = brand;
        product.category = category;
        product.countInStock = countInStock;
        if (image) product.image = image;

        await product.save();
        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to update product');
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
};

// @desc    Delete product
// @route   DELETE /admin/products/:id
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                error: 'Product not found' 
            });
        }

        await product.remove();
        req.flash('success', 'Product deleted successfully');
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to delete product');
        res.redirect('/admin/products');
    }
};