/**
 * @swagger
 * tags:
 *   name: Shops
 *   description: Manage shops, verification, and shop documents
 */

/**
 * @swagger
 * /api/shops:
 *   get:
 *     summary: Get all shops
 *     tags: [Shops]
 *     responses:
 *       200:
 *         description: List of all shops
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/shops/unverified:
 *   get:
 *     summary: Get all unverified shops
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unverified shops
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/shops:
 *   post:
 *     summary: Create a new shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               businessType:
 *                 type: string
 *               registrationNo:
 *                 type: string
 *               taxPin:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               website:
 *                 type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Shop created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/shops/getMyShops:
 *   get:
 *     summary: Get shops belonging to the logged-in user
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's shops
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     summary: Get a shop by its ID
 *     tags: [Shops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop details
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/shops/{id}:
 *   put:
 *     summary: Update a shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               businessType:
 *                 type: string
 *               registrationNo:
 *                 type: string
 *               taxPin:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               website:
 *                 type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Shop updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/shops/verify/{id}:
 *   put:
 *     summary: Verify a shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID to verify
 *     responses:
 *       200:
 *         description: Shop verified successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/shops/{id}:
 *   delete:
 *     summary: Delete a shop (owner only)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/shops/admin/{id}:
 *   delete:
 *     summary: Delete a shop (admin only)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop deleted successfully by admin
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
