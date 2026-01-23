/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Temporary image uploads to Cloudinary
 */

/**
 * @swagger
 * /api/upload/temp:
 *   post:
 *     summary: Upload temporary images to Cloudinary
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *             required:
 *               - images
 *     responses:
 *       200:
 *         description: Successfully uploaded images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *       400:
 *         description: No images uploaded or invalid files
 *       500:
 *         description: Image upload failed
 */
