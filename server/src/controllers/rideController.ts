import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import Ride from '../models/Ride';
import { uploadDir } from '../config/env';

function parseRideBody(body: Record<string, unknown>) {
  const data = { ...body };
  if (data.capacity != null) data.capacity = Number(data.capacity);
  if (data.minimumHeight != null) data.minimumHeight = Number(data.minimumHeight);
  if (data.price != null) data.price = Number(data.price);
  return data;
}

function fileUrl(
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
  field: string,
  subfolder: string,
): string | undefined {
  const fileList = files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const file = fileList?.[field]?.[0];
  if (!file) return undefined;
  return `/uploads/${subfolder}/${file.filename}`;
}

function removeFile(url: string | undefined): void {
  if (!url || !url.startsWith('/uploads/')) return;
  const relative = url.replace('/uploads/', '');
  const fullPath = path.join(uploadDir, relative);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export async function getRides(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Record<string, string> = {};
    if (req.query.status) {
      filter.status = String(req.query.status);
    }
    const rides = await Ride.find(filter).sort({ name: 1 });
    res.json({ rides });
  } catch (err) {
    next(err);
  }
}

export async function getRideById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      res.status(404).json({ message: 'המתקן לא נמצא' });
      return;
    }
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function createRide(req: Request, res: Response, next: NextFunction): Promise<void> {
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

export async function updateRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      res.status(404).json({ message: 'המתקן לא נמצא' });
      return;
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

export async function deleteRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);
    if (!ride) {
      res.status(404).json({ message: 'המתקן לא נמצא' });
      return;
    }
    removeFile(ride.imageUrl);
    removeFile(ride.audioUrl);
    res.json({ message: 'המתקן נמחק' });
  } catch (err) {
    next(err);
  }
}
