/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews management
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a review for a product
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to review
 *               rating:
 *                 type: number
 *                 description: Rating value (e.g., 1-5)
 *               comment:
 *                 type: string
 *                 description: Optional review comment
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: User has already reviewed this product or invalid input
 *       401:
 *         description: Unauthorized (user not logged in)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Get all reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product
 *     responses:
 *       200:
 *         description: List of reviews for the product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       comment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           fullName:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/reviews/product/{productId}/user:
 *   get:
 *     summary: Get the logged-in user's review for a product
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product
 *     responses:
 *       200:
 *         description: User's review for the product (if exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 review:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     comment:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized (user not logged in)
 *       500:
 *         description: Internal server error
 */
