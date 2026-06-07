const fs = require('fs');
const path = require('path');
const Ride = require('../models/Ride');
const { uploadDir } = require('../config/env');

function parseRideBody(body) {
  const data = { ...body };
  if (data.capacity != null) data.capacity = Number(data.capacity);
  if (data.minimumHeight != null) data.minimumHeight = Number(data.minimumHeight);
  if (data.price != null) data.price = Number(data.price);
  return data;
}

function fileUrl(files, field, subfolder) {
  const file = files?.[field]?.[0];
  if (!file) return undefined;
  return `/uploads/${subfolder}/${file.filename}`;
}

function removeFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const relative = url.replace('/uploads/', '');
  const fullPath = path.join(uploadDir, relative);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

async function getRides(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const rides = await Ride.find(filter).sort({ name: 1 });
    res.json({ rides });
  } catch (err) {
    next(err);
  }
}

async function getRideById(req, res, next) {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'המתקן לא נמצא' });
    }
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

async function createRide(req, res, next) {
  try {
    const data = parseRideBody(req.body);
    const imageUrl = fileUrl(req.files, 'image', 'images');
    const audioUrl = fileUrl(req.files, 'audio', 'audio');
    if (imageUrl) data.imageUrl = imageUrl;
    if (audioUrl) data.audioUrl = audioUrl;

    const ride = await Ride.create(data);
    res.status(201).json({ ride });
  } catch (err) {
    next(err);
  }
}

async function updateRide(req, res, next) {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'המתקן לא נמצא' });
    }

    const data = parseRideBody(req.body);
    const imageUrl = fileUrl(req.files, 'image', 'images');
    const audioUrl = fileUrl(req.files, 'audio', 'audio');

    if (imageUrl) {
      removeFile(ride.imageUrl);
      data.imageUrl = imageUrl;
    }
    if (audioUrl) {
      removeFile(ride.audioUrl);
      data.audioUrl = audioUrl;
    }

    Object.assign(ride, data);
    await ride.save();
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

async function deleteRide(req, res, next) {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'המתקן לא נמצא' });
    }
    removeFile(ride.imageUrl);
    removeFile(ride.audioUrl);
    res.json({ message: 'המתקן נמחק' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRides, getRideById, createRide, updateRide, deleteRide };
