/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management and retrieval
 */

/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - category
 *               - condition
 *               - productType
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discountPrice:
 *                 type: number
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               subItem:
 *                 type: string
 *               warranty:
 *                 type: string
 *               stockInCount:
 *                 type: number
 *               status:
 *                 type: string
 *               quickSale:
 *                 type: boolean
 *               condition:
 *                 type: string
 *               productType:
 *                 type: string
 *                 enum: [INDIVIDUAL, SHOP]
 *               shopId:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error or missing images
 *       403:
 *         description: Unauthorized (shop not verified or not owner)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/product/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discountPrice:
 *                 type: number
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               subItem:
 *                 type: string
 *               warranty:
 *                 type: string
 *               stockInCount:
 *                 type: number
 *               status:
 *                 type: string
 *               quickSale:
 *                 type: boolean
 *               condition:
 *                 type: string
 *               productType:
 *                 type: string
 *                 enum: [INDIVIDUAL, SHOP]
 *               shopId:
 *                 type: string
 *               removeImages:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized (not owner or admin)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/product:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products with seller info and ratings
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/product/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/product/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Unauthorized (not owner or admin)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
