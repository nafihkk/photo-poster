import React from 'react'
import PosterEditor from './components/PosterEditor'

export default function App() {
  return (
    <div className="app-root">
      <header className="topbar">
        <h1>Photo Poster Generator</h1>
        <p className="subtitle">Upload a photo, position it, add your name and download your poster</p>
      </header>

      <main>
        <PosterEditor />
      </main>

      <footer className="footer">Made with ♥ only</footer>
    </div>
  )
}
