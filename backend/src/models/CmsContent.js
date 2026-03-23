const mongoose = require('mongoose');

// Admin-controlled CMS for landing page content
const cmsContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g. "hero_title", "about_text"
    section: { type: String, required: true }, // e.g. "hero", "about", "how_it_works"
    type: { type: String, enum: ['text', 'image', 'json', 'html'], default: 'text' },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    label: { type: String }, // human-readable label for admin UI
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CmsContent', cmsContentSchema);
