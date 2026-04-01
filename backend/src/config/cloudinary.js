const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER = process.env.CLOUDINARY_FOLDER || 'rodofood';

// Menu item images
const menuStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `${FOLDER}/menu`,
    allowed_formats: ['jpg','jpeg','png','webp'],
    transformation: [{ width: 600, height: 450, crop: 'fill', quality: 'auto' }],
  },
});

// Restaurant cover/gallery images
const restaurantStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `${FOLDER}/restaurants`,
    allowed_formats: ['jpg','jpeg','png','webp'],
    transformation: [{ width: 1200, height: 600, crop: 'fill', quality: 'auto' }],
  },
});

const uploadMenu       = multer({ storage: menuStorage,       limits: { fileSize: 5 * 1024 * 1024 } });
const uploadRestaurant = multer({ storage: restaurantStorage, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { cloudinary, uploadMenu, uploadRestaurant };
