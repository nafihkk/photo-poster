import React, { useRef, useState } from 'react'
import CropModal from './CropModal'

/*
  FRAME_CONFIG: define the fixed photo frame area relative to the template's natural size (pixels).
  Adjust these values to match where you want the photo to appear on the template.
  For instance, if your template image is 1200x1800 pixels, set x,y,width,height accordingly.
*/
const FRAME_CONFIG = {
  // Example values — change to match your template's layout.
  // Using values that suit a left-side portrait frame (tweak as necessary)
  x: 60,    // px from left
  y: 560,    // px from top
  width: 430, // frame width in px
  height: 570 // frame height in px
};

export default function PosterEditor(){
  const templateSrc = '/sample-template.png' // put your poster file here
  const [uploadedDataUrl, setUploadedDataUrl] = useState(null) // original uploaded file
  const [croppedDataUrl, setCroppedDataUrl] = useState(null)   // cropped data used for final draw
  const [showCrop, setShowCrop] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const templateRef = useRef({ width: 1000, height: 1500 }) // will be updated when template loads

  // helper to load image natural size
  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = ()=>resolve(img)
      img.onerror = (e)=>reject(e)
      img.src = src
    })
  }

  function onFileChange(e){
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setUploadedDataUrl(reader.result)
      setShowCrop(true)
    }
    reader.readAsDataURL(f)
  }

  async function handleApplyCrop(croppedDataUrl){
    // croppedDataUrl is PNG dataURL matching the cropping rectangle chosen by user.
    // We set it and close modal.
    setCroppedDataUrl(croppedDataUrl)
    setShowCrop(false)
    setMessage('Crop applied — preview below')
    setTimeout(()=>setMessage(''), 2000)
  }

  function cancelCrop(){ setShowCrop(false) }

  async function downloadJPEG(){
    try{
      // load template to know its natural size
      const tpl = await loadImage(templateSrc)
      const W = tpl.width
      const H = tpl.height

      // create canvas with template natural dimensions
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      // draw template
      ctx.drawImage(tpl, 0, 0, W, H)

      // draw cropped photo into FRAME_CONFIG position & size
      if (croppedDataUrl){
        const img = await loadImage(croppedDataUrl)

        // croppedDataUrl likely has same pixel size as the cropped area chosen in crop modal.
        // We'll simply draw it to the frame rectangle (it will be stretched if sizes differ).
        ctx.drawImage(img, FRAME_CONFIG.x, FRAME_CONFIG.y, FRAME_CONFIG.width, FRAME_CONFIG.height)
      } else {
        // optional: draw placeholder or do nothing
      }

      // draw the name directly under the frame in a fixed position
      if (name && name.trim()){
        ctx.save()
        const fontSize = Math.round(Math.max(18, FRAME_CONFIG.width * 0.07)) // scale with frame width
        ctx.font = `700 ${fontSize}px Inter, sans-serif`
        ctx.fillStyle = '#ffffff' // choose color that contrasts; adjust if necessary
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        // position: centered under the frame; slight gap
        const textX = FRAME_CONFIG.x + FRAME_CONFIG.width / 2
        const textY = FRAME_CONFIG.y + FRAME_CONFIG.height + Math.round(fontSize * 0.4)
        // text shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.6)'
        ctx.shadowBlur = 8
        ctx.fillText(name, textX, textY)
        ctx.restore()
      }

      // export as JPEG
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92)
      const a = document.createElement('a')
      a.href = jpegDataUrl
      a.download = (name ? name.replace(/\s+/g,'_') : 'poster') + '.jpg'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setMessage('Downloaded as JPEG')
      setTimeout(()=>setMessage(''), 2000)
    }catch(err){
      console.error('downloadJPEG error', err)
      setMessage('Export failed')
    }
  }

  return (
    <div className="editor-wrap">
      <div className="left card controls">
        <label className="filelabel">
          <input type="file" accept="image/*" onChange={onFileChange}/>
          Choose a photo 
        </label>

        <label className="label">Name </label>
        <input type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />

        <div className="crop-area-note">
          The photo will be placed into a fixed frame on the left of the poster. Crop to adjust which part of your photo appears inside this frame.
        </div>

        <div className="actions">
          <button className="btn" onClick={()=>setShowCrop(true)} disabled={!uploadedDataUrl}>Crop</button>
          <button className="btn" onClick={downloadJPEG}>Download</button>
          <button className="btn ghost" onClick={() => { setUploadedDataUrl(null); setCroppedDataUrl(null); setName(''); }}>Reset</button>
        </div>

        {message && <p className="msg">{message}</p>}
      </div>

      <div className="right card preview">
        <div style={{width:'100%', position:'relative', overflow:'hidden', borderRadius:12}}>
          {/* Template preview with the cropped image composited visually for quick preview */}
          <img src={templateSrc} alt="template" style={{width:'100%', display:'block'}} onLoad={(e)=>{
            // update templateRef natural size
            const img = e.target
            templateRef.current.width = img.naturalWidth
            templateRef.current.height = img.naturalHeight
          }} />

          {/* overlay a preview of the cropped photo positioned relative to the displayed template */}
          {/* This overlay uses percentages so it scales with displayed image */}
          <div style={{
            position:'absolute',
            left: `${(FRAME_CONFIG.x / templateRef.current.width) * 100}%`,
            top: `${(FRAME_CONFIG.y / templateRef.current.height) * 100}%`,
            width: `${(FRAME_CONFIG.width / templateRef.current.width) * 100}%`,
            height: `${(FRAME_CONFIG.height / templateRef.current.height) * 100}%`,
            transform: 'translate(0,0)',
            borderRadius:12,
            overflow:'hidden',
            boxShadow:'0 6px 18px rgba(0,0,0,0.25)'
          }}>
            {croppedDataUrl ? (
              <img src={croppedDataUrl} alt="cropped preview" style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
            ) : (
              <div style={{width:'100%', height:'100%', background:'rgba(0,0,0,0.06)', display:'flex',alignItems:'center',justifyContent:'center', color:'#666'}}>No photo</div>
            )}
          </div>

          {/* render name under the frame (scaled) */}
          {name && (
            <div style={{
              position:'absolute',
              left: `${(FRAME_CONFIG.x / templateRef.current.width) * 100}%`,
              top: `${((FRAME_CONFIG.y + FRAME_CONFIG.height + 10) / templateRef.current.height) * 100}%`,
              width: `${(FRAME_CONFIG.width / templateRef.current.width) * 100}%`,
              transform:'translateX(0%)',
              textAlign:'center',
              pointerEvents:'none'
            }}>
              <div style={{ color:'#fff', fontWeight:700, textShadow:'0 3px 8px rgba(0,0,0,0.6)', fontSize:'clamp(12px, 2.8vw, 28px)' }}>{name}</div>
            </div>
          )}
        </div>

        <p className="hint">Preview: the cropped image and name show where they will appear on the final poster.</p>
      </div>

      {showCrop && uploadedDataUrl && (
        <CropModal
          imageSrc={uploadedDataUrl}
          aspect={FRAME_CONFIG.width / FRAME_CONFIG.height}
          onCancel={cancelCrop}
          onComplete={handleApplyCrop}
          initialZoom={1}
        />
      )}
    </div>
  )
}
