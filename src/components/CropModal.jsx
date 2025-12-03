import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

/*
  Props:
    - imageSrc (dataURL)
    - aspect (width/height ratio)
    - onCancel()
    - onComplete(croppedDataUrl)
    - initialZoom, initialCrop
    - fixedCropWidthPx, fixedCropHeightPx (not required here)
*/

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

// crop logic adapted to produce an exact cropped canvas from an image and cropping area
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      // return a data URL as well
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

export default function CropModal({ imageSrc, aspect = 3/4, onCancel, onComplete, initialZoom = 1 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixelsArg) => {
    setCroppedAreaPixels(croppedAreaPixelsArg);
  }, []);

  const doComplete = useCallback(async () => {
    if (!croppedAreaPixels) return;
    const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
    onComplete(croppedDataUrl);
  }, [croppedAreaPixels, imageSrc, onComplete]);

  return (
    <div style={modalStyle}>
      <div style={modalInnerStyle}>
        <div style={{position:'relative', width:'100%', height:400, background:'#333'}}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={false}
          />
        </div>

        <div style={{display:'flex', gap:8, marginTop:12, justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <label style={{fontWeight:600}}>Zoom</label>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e=>setZoom(Number(e.target.value))} />
          </div>

          <div style={{display:'flex', gap:8}}>
            <button className="btn ghost" onClick={onCancel}>Cancel</button>
            <button className="btn" onClick={doComplete}>Apply Crop</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// simple inline modal styles
const modalStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
}
const modalInnerStyle = { width: 720, maxWidth: '95%', background: '#fff', padding: 16, borderRadius: 12 }
