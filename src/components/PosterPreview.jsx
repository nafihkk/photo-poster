import React, { useRef, useEffect, useState } from 'react'

export default function PosterPreview({ templateSrc, photo, x, y, scale, name, onMove, onSetPosition }){
  const canvasRef = useRef(null)
  const [templateSize, setTemplateSize] = useState({w: 800, h: 1200})
  const dragging = useRef(false)
  const lastPos = useRef({x:0,y:0})

  useEffect(()=>{
    drawPreview()
    // eslint-disable-next-line
  }, [templateSrc, photo, x, y, scale, name])

  async function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = ()=>resolve(img)
      img.onerror = (e)=>reject(e)
      img.src = src
    })
  }

  async function drawPreview(){
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    try{
      const template = await loadImage(templateSrc)
      // we'll render preview at half (or fit) of template width for responsiveness
      // choose preview width based on container width
      const containerWidth = canvas.parentElement.clientWidth || 420
      const ratio = Math.min(1, containerWidth / template.width)
      const previewW = Math.round(template.width * ratio)
      const previewH = Math.round(template.height * ratio)

      canvas.width = previewW
      canvas.height = previewH

      // keep template natural size for final export; store scaled template size for mapping drag -> full coords
      setTemplateSize({ w: template.width, h: template.height })

      ctx.clearRect(0,0,canvas.width,canvas.height)
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height)

      if (photo){
        const img = await loadImage(photo)

        // compute scaled dimensions for preview canvas
        const destW = (img.width * scale) * (canvas.width / template.width)
        const destH = (img.height * scale) * (canvas.width / template.width) // keep aspect via width scaling

        const centerX = canvas.width/2
        const centerY = canvas.height/2

        const destX = centerX + (x * (canvas.width / template.width)) - destW/2
        const destY = centerY + (y * (canvas.height / template.height)) - destH/2

        ctx.save()
        ctx.drawImage(img, destX, destY, destW, destH)
        ctx.restore()
      }

      if (name){
        ctx.save()
        const fontSize = Math.round(Math.max(12, canvas.width * 0.045))
        ctx.font = `700 ${fontSize}px Inter, sans-serif`
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 6
        ctx.fillText(name, canvas.width/2, canvas.height - fontSize*0.6)
        ctx.restore()
      }
    }catch(err){
      console.error('drawPreview error', err)
    }
  }

  // pointer/drag handlers to support moving the photo by dragging the preview
  function onPointerDown(e){
    dragging.current = true
    const rect = canvasRef.current.getBoundingClientRect()
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    canvasRef.current.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e){
    if (!dragging.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const cur = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const dx = cur.x - lastPos.current.x
    const dy = cur.y - lastPos.current.y
    lastPos.current = cur

    // map dx/dy in preview pixels to template pixels and call onMove
    const canvas = canvasRef.current
    const templateRatioX = templateSize.w / canvas.width
    const templateRatioY = templateSize.h / canvas.height
    const moveX = dx * templateRatioX
    const moveY = dy * templateRatioY

    if (typeof onMove === 'function') onMove(moveX, moveY)
  }
  function onPointerUp(e){
    dragging.current = false
    try{ canvasRef.current.releasePointerCapture(e.pointerId) }catch{}
  }

  return (
    <div style={{width:'100%'}}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{touchAction:'none', cursor:'grab'}}
      />
    </div>
  )
}
