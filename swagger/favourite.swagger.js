/**
 * @swagger
 * tags:
 *   name: Favourites
 *   description: Manage user favourite products
 */

/**
 * @swagger
 * /api/favourite:
 *   post:
 *     summary: Add a product to user's favourites
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 641b1f6a2f1d5c001f5b1234
 *     responses:
 *       201:
 *         description: Product added to favourites
 *       400:
 *         description: Bad request or already in favourites
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/favourite/{productId}:
 *   delete:
 *     summary: Remove a product from user's favourites
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove from favourites
 *     responses:
 *       200:
 *         description: Product removed from favourites
 *       404:
 *         description: Product not found in favourites
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/favourite:
 *   get:
 *     summary: Get all favourite products for logged-in user
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's favourite products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: string
 *                   title:
 *                     type: string
 *                   price:
 *                     type: number
 *                   imageUrl:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
