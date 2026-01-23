/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing and management
 */

/**
 * @swagger
 * /api/payment/initiate:
 *   post:
 *     summary: Initiate a payment via M-Pesa
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - phone
 *               - productData
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 641b1f6a2f1d5c001f5b1234
 *               phone:
 *                 type: string
 *                 example: 0712345678
 *               productData:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   condition:
 *                     type: string
 *                   price:
 *                     type: number
 *                   discountPrice:
 *                     type: number
 *                   stockInCount:
 *                     type: number
 *                   imageUrl:
 *                     type: string
 *                   imageUrls:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *       400:
 *         description: Invalid phone number or product price
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/payment/callback:
 *   post:
 *     summary: M-Pesa callback endpoint for payment confirmation
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Callback received and processed
 *       400:
 *         description: Invalid callback data
 */

/**
 * @swagger
 * /api/payment/status/{checkoutRequestId}:
 *   get:
 *     summary: Check the status of a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: checkoutRequestId
 *         required: true
 *         schema:
 *           type: string
 *         description: M-Pesa checkout request ID
 *     responses:
 *       200:
 *         description: Payment status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/payment:
 *   get:
 *     summary: Get all payments (Admin)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of all payments
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/payment/{id}:
 *   delete:
 *     summary: Delete a payment by ID (Admin)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/payment/{id}:
 *   put:
 *     summary: Update payment status by ID (Admin)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: completed
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
