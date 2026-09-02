"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function AgoraVadaPortal() {
  // === STATE NAVIGASI UTAMA ===
  const [mainMenu, setMainMenu] = useState('home'); // 'home', 'agora', 'representment'

  // === STATE AGORA VADA (LAMA) ===
  const [currentPage, setCurrentPage] = useState(1);
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  const [judulHtml, setJudulHtml] = useState('');
  const [sumberBerita, setSumberBerita] = useState('');
  const [imageUrl, setImageUrl] = useState(''); 
  const [isCopied, setIsCopied] = useState(false);
  
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [imgScale, setImgScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [teksX, setTeksX] = useState(140);
  const [teksY, setTeksY] = useState(800);
  const [ukuranFont, setUkuranFont] = useState(79);
  const [jarakBaris, setJarakBaris] = useState(1.4);

  const [sumberX, setSumberX] = useState(142); 
  const [sumberY, setSumberY] = useState(710);
  const [ukuranFontSumber, setUkuranFontSumber] = useState(28);

  const canvasRef = useRef(null);
  const [loadedBgImg, setLoadedBgImg] = useState(null);
  const [templateImgObj, setTemplateImgObj] = useState(null);

  // === STATE REPRESENTMENT (EXCEL BARU) ===
  const [activeTab, setActiveTab] = useState("ALTO");
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [altoData, setAltoData] = useState([]);
  const [rintisData, setRintisData] = useState([]);

  // ==========================================
  // EFFECT & FUNGSI AGORA VADA (TIDAK DIUBAH)
  // ==========================================
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fontSB = new FontFace('PoppinsSemiBold', 'url(/Poppins-SemiBold.ttf)');
        await fontSB.load();
        document.fonts.add(fontSB);

        const fontSBI = new FontFace('PoppinsSemiBoldItalic', 'url(/Poppins-SemiBoldItalic.ttf)');
        await fontSBI.load();
        document.fonts.add(fontSBI);
      } catch (err) {
        console.warn("Font Poppins gagal di-load. Pastikan file ada di folder public.");
      }
    };
    loadFonts();

    const tImg = new Image();
    tImg.src = '/Agora Vada Template.png';
    tImg.onload = () => setTemplateImgObj(tImg);
  }, []);

  useEffect(() => {
    if (!imageUrl) {
      setLoadedBgImg(null);
      return;
    }

    let isCancelled = false;

    const fetchImageSafely = async () => {
      const tryLoad = (url) => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = url;
      });

      if (!imageUrl.startsWith('http')) {
        try { 
          const img = await tryLoad(imageUrl); 
          if (!isCancelled) setLoadedBgImg(img); 
        } catch(e) {}
        return;
      }

      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
        `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
        imageUrl 
      ];

      for (let proxy of proxies) {
        try {
          const img = await tryLoad(proxy);
          if (!isCancelled) setLoadedBgImg(img);
          return; 
        } catch(e) {
          continue; 
        }
      }

      if (!isCancelled) {
        setLoadedBgImg(null);
        alert("Server website memblokir akses gambar ini. Silakan download gambarnya secara manual, lalu gunakan menu 'UPLOAD DARI PC/HP'.");
      }
    };

    fetchImageSafely();

    return () => { isCancelled = true; };
  }, [imageUrl]);

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    const editor = document.getElementById('judul-editor');
    if (editor) setJudulHtml(editor.innerHTML);
  };

  const renderRichText = (ctx, htmlString, x, y, maxWidth, lineHeight, baseFontSize) => {
    if (!htmlString) return; 
    ctx.textAlign = 'left'; 
    ctx.textBaseline = 'top'; 

    const cleanHTML = htmlString
      .replace(/<div[^>]*><br><\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<br\s*[\/]?>/gi, '\n');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHTML;
    
    let wordsWithContext = [];
    const extract = (node, currentContext) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent;
        let tokens = text.split('\n');
        tokens.forEach((lineText, index) => {
          if (index > 0) wordsWithContext.push({ word: '', ...currentContext, isNewline: true });
          let words = lineText.split(/\s+/);
          words.forEach(w => {
            if (w.trim().length > 0) wordsWithContext.push({ word: w.trim(), ...currentContext, isNewline: false });
          });
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        let newContext = { ...currentContext };
        const tag = node.tagName.toLowerCase();
        
        if (tag === 'i' || tag === 'em') newContext.isItalic = true;
        if (node.style && node.style.color) newContext.color = node.style.color;
        if (tag === 'font' && node.getAttribute('color')) newContext.color = node.getAttribute('color');
        
        node.childNodes.forEach(child => extract(child, newContext));
      }
    };
    
    extract(tempDiv, { color: '#FFFFFF', isItalic: false }); 

    let lines = [];
    let currentLine = [];
    let currentWidth = 0;
    
    ctx.font = `${baseFontSize}px PoppinsSemiBold, sans-serif`;
    const spaceWidth = ctx.measureText(' ').width;

    wordsWithContext.forEach(item => {
      if (item.isNewline) {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
      } else {
        const fontName = item.isItalic ? 'PoppinsSemiBoldItalic' : 'PoppinsSemiBold';
        ctx.font = `${baseFontSize}px ${fontName}, sans-serif`;
        let wWidth = ctx.measureText(item.word).width;
        
        if (currentWidth + wWidth > maxWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = [item];
          currentWidth = wWidth + spaceWidth;
        } else {
          currentLine.push(item);
          currentWidth += wWidth + spaceWidth;
        }
      }
    });
    if (currentLine.length > 0) lines.push(currentLine);

    let currentY = y;
    lines.forEach(lineArr => {
      let currentX = x;
      lineArr.forEach(item => {
        const fontName = item.isItalic ? 'PoppinsSemiBoldItalic' : 'PoppinsSemiBold';
        ctx.font = `${baseFontSize}px ${fontName}, sans-serif`;
        ctx.fillStyle = item.color;
        ctx.fillText(item.word, currentX, currentY);
        currentX += ctx.measureText(item.word).width + spaceWidth;
      });
      currentY += lineHeight;
    });
  };

  useEffect(() => {
    if (mainMenu !== 'agora' || currentPage !== 3) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (loadedBgImg) {
      ctx.save();
      const drawW = loadedBgImg.width * imgScale;
      const drawH = loadedBgImg.height * imgScale;
      ctx.drawImage(loadedBgImg, imgX, imgY, drawW, drawH);
      ctx.restore();
    }

    if (templateImgObj) {
      ctx.drawImage(templateImgObj, 0, 0, canvas.width, canvas.height);
    }

    const lh = ukuranFont * jarakBaris;
    renderRichText(ctx, judulHtml, teksX, teksY, 950, lh, ukuranFont);

    if (sumberBerita) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${ukuranFontSumber}px PoppinsSemiBoldItalic, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(sumberBerita, sumberX, sumberY);
    }

  }, [mainMenu, currentPage, loadedBgImg, templateImgObj, imgX, imgY, imgScale, teksX, teksY, ukuranFont, jarakBaris, sumberX, sumberY, ukuranFontSumber, judulHtml, sumberBerita]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    setDragStart({ x: clientX - imgX, y: clientY - imgY });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    setImgX(clientX - dragStart.x);
    setImgY(clientY - dragStart.y);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.05;
    if (e.deltaY < 0) setImgScale(p => Math.min(p + zoomIntensity, 5));
    else setImgScale(p => Math.max(p - zoomIntensity, 0.1));
  };

  const handleUploadFoto = (e) => {
    const file = e.target.files[0];
    if (file) setImageUrl(URL.createObjectURL(file));
  };

  const downloadGambar = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'AgoraVada_Post.jpg';
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptTeks);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); 
  };


  // ==========================================
  // FUNGSI REPRESENTMENT (EXCEL BARU)
  // ==========================================
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let allParsedData = [];

    for (let file of files) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        allParsedData = [...allParsedData, ...json];
      });
    }

    setTotalDataCount(allParsedData.length);

    // Memilah berdasarkan SWTC Code
    const alto = allParsedData.filter(
      (row) => row["SWTC code"] === "ALT" || row["SWTC Code"] === "ALT" || row["swtc code"] === "ALT"
    );
    const rintis = allParsedData.filter(
      (row) => row["SWTC code"] === "RTS" || row["SWTC Code"] === "RTS" || row["swtc code"] === "RTS"
    );

    setAltoData(alto);
    setRintisData(rintis);
  };

  const renderTable = (data) => (
    <div style={{ overflowX: 'auto', marginTop: '20px', borderRadius: '10px', border: '1px solid #30363d', backgroundColor: '#0d1117' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#c9d1d9', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
        <thead style={{ backgroundColor: '#21262d', borderBottom: '1px solid #30363d' }}>
          <tr>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>No</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Bank Issuer</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Transaction Date</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Reff Nr</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Id Trx</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Reference</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Transaction Amount</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Merchant Name</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Reason</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Parent Name</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #30363d' }}>
                <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 'bold' }}>{index + 1}</td>
                <td style={{ padding: '12px 16px' }}>{row["Bank Issuer"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Transaction Date"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Reff Nr"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Id Trx"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Reference"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Transaction Amount"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Merchant Name"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Reason"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Parent Name"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Status"] || "-"}</td>
                <td style={{ padding: '12px 16px' }}>{row["Invoice"] || row["invoice"] || "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" style={{ padding: '30px', textAlign: 'center', color: '#8b949e' }}>
                Tidak ada data yang sesuai.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );


  // ==========================================
  // RENDER UTAMA
  // ==========================================
  
  // Hitung max width dinamis tergantung menu yang lagi dibuka
  let containerMaxWidth = '480px';
  if (mainMenu === 'representment') containerMaxWidth = '1200px'; // Excel butuh tabel lebar
  if (mainMenu === 'agora' && currentPage === 3) containerMaxWidth = '950px'; // Editor visual
  
  return (
    <div style={{ width: '100%', maxWidth: containerMaxWidth, margin: '0 auto', padding: '20px', transition: 'max-width 0.3s ease', fontFamily: 'sans-serif' }}>
      
      {/* HEADER NAVIGASI */}
      {mainMenu !== 'home' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            onClick={() => setMainMenu('home')} 
            style={{ background: 'none', border: '1px solid #30363d', backgroundColor: '#21262d', color: '#c9d1d9', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            ⬅ Home
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px', color: '#ffffff', margin: 0 }}>
            {mainMenu === 'agora' ? '⚡ AGORA VADA' : '📊 REPRESENTMENT'}
          </h1>
          <div style={{ width: '70px' }}></div> {/* Spacer untuk ke-tengah */}
        </div>
      )}


      {/* ===================================== */}
      {/* 1. HALAMAN LANDING PAGE (HOME)        */}
      {/* ===================================== */}
      {mainMenu === 'home' && (
        <div style={{ textAlign: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: '800', color: '#ffffff', marginBottom: '10px' }}>
            Representment
          </h1>
          <p style={{ color: '#8b949e', marginBottom: '40px', fontSize: '14px' }}>Pilih sistem yang ingin dijalankan hari ini.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* Tombol Extract Excel */}
            <button 
              onClick={() => setMainMenu('representment')}
              style={{ width: '100%', maxWidth: '320px', backgroundColor: '#238636', color: '#ffffff', padding: '16px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(35, 134, 54, 0.2)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M9.5 12.5l5 5"></path>
                <path d="M14.5 12.5l-5 5"></path>
              </svg>
              Extract File Excel
            </button>
            
            {/* Tombol Agora Vada */}
            <button 
              onClick={() => setMainMenu('agora')}
              style={{ width: '100%', maxWidth: '320px', backgroundColor: '#21262d', color: '#c9d1d9', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '15px', border: '1px solid #30363d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              ⚡ Agora Vada Generator
            </button>
          </div>
        </div>
      )}


      {/* ===================================== */}
      {/* 2. MENU REPRESENTMENT (EXCEL BARU)    */}
      {/* ===================================== */}
      {mainMenu === 'representment' && (
        <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
            Upload File Rekapitulasi (.xlsx / .xls)
          </h2>
          
          {/* Uploader */}
          <div style={{ backgroundColor: '#0d1117', border: '1px dashed #30363d', padding: '20px', borderRadius: '10px', marginBottom: '24px' }}>
             <input
                type="file"
                multiple
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                style={{ color: '#c9d1d9', fontSize: '13px', width: '100%' }}
              />
          </div>

          {/* Dashboard Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#8b949e', fontWeight: 'bold', letterSpacing: '1px' }}>TOTAL ROW TERBACA</div>
              <div style={{ fontSize: '28px', color: '#ffffff', fontWeight: '900', marginTop: '4px' }}>{totalDataCount}</div>
            </div>
            <div style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderTop: '3px solid #1f6feb', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#8b949e', fontWeight: 'bold', letterSpacing: '1px' }}>DATA ALTO (ALT)</div>
              <div style={{ fontSize: '28px', color: '#58a6ff', fontWeight: '900', marginTop: '4px' }}>{altoData.length}</div>
            </div>
            <div style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderTop: '3px solid #f85149', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#8b949e', fontWeight: 'bold', letterSpacing: '1px' }}>DATA RINTIS (RTS)</div>
              <div style={{ fontSize: '28px', color: '#ff7b72', fontWeight: '900', marginTop: '4px' }}>{rintisData.length}</div>
            </div>
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #30363d', paddingBottom: '16px' }}>
            <button 
              onClick={() => setActiveTab("ALTO")}
              style={{ padding: '8px 24px', backgroundColor: activeTab === "ALTO" ? '#1f6feb' : '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              ALTO
            </button>
            <button 
              onClick={() => setActiveTab("RINTIS")}
              style={{ padding: '8px 24px', backgroundColor: activeTab === "RINTIS" ? '#da3633' : '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              RINTIS
            </button>
          </div>

          {/* Render Table */}
          {activeTab === "ALTO" ? renderTable(altoData) : renderTable(rintisData)}

        </div>
      )}


      {/* ===================================== */}
      {/* 3. MENU AGORA VADA (FUNGSI LAMA FULL) */}
      {/* ===================================== */}
      {mainMenu === 'agora' && (
        <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>

          {/* ================= PAGE 1 ================= */}
          {currentPage === 1 && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>1. Masukkan Link Berita</h2>
              <input 
                type="text" placeholder="https://news.com/..." 
                style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#ffffff', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
                value={urlBerita} onChange={(e) => setUrlBerita(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{ width: '50%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }}
                  onClick={async () => {
                    if (!urlBerita) return alert("Masukkan link dulu!");
                    
                    setPromptTeks("Menyedot data dari web, tunggu sebentar...");
                    try {
                      const res = await fetch("/api/tarik-berita", { 
                        method: "POST", 
                        headers: { "Content-Type": "application/json" }, 
                        body: JSON.stringify({ url: urlBerita }) 
                      });
                      
                      const data = await res.json();
                      
                      if(data.status === "success") {
                        const promptSakti = `Tolong buat 10 judul berita menggunakan hook dan copywriter handal untuk media alternatif "AgoraVada", serta buatkan caption untuk instagram, normatif saja dan informatif. Pastikan diakhiri oleh sumber berita dan 3 hastag (wajib ada #AgoraVada sisanya disesuaikan dengan kata kunci subjek dan topik yang dibahas).\n\n${data.prompt}`;
                        
                        setPromptTeks(promptSakti); 
                        setSumberBerita(data.sumber || (urlBerita ? `Sumber Berita: ${new URL(urlBerita).hostname}` : ''));
                        if(data.gambar_url) setImageUrl(data.gambar_url);
                        setCurrentPage(2);
                      } else {
                        const pesanError = data.error || data.message || data.details || data.detail || "Terhalang sistem keamanan website.";
                        alert("Gagal menyedot: " + pesanError);
                        setPromptTeks("Gagal menyedot data otomatis. Silakan ketik manual.");
                      }
                    } catch(err) { 
                      alert("Gagal konek ke API Vercel. Pastikan folder app/api/tarik-berita/route.js sudah dibuat."); 
                    }
                  }}
                >Tarik Data 🔄</button>
                <button 
                  style={{ width: '50%', backgroundColor: '#238636', color: '#ffffff', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    if(urlBerita) { 
                      try { setSumberBerita(`Sumber Berita: ${new URL(urlBerita).hostname}`); } 
                      catch(e) { setSumberBerita(''); } 
                    }
                    setCurrentPage(3);
                  }}
                >Langsung ke Editor ➔</button>
              </div>
            </div>
          )}

          {/* ================= PAGE 2 ================= */}
          {currentPage === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#c9d1d9', margin: 0 }}>2. Prompt Manual & Edit Teks</h2>
                <button 
                  onClick={handleCopyPrompt}
                  style={{ 
                    backgroundColor: isCopied ? '#238636' : '#21262d', 
                    color: '#ffffff', 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    border: isCopied ? '1px solid #2ea043' : '1px solid #30363d', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isCopied ? "✅ Tersalin!" : "📋 Copy Prompt"}
                </button>
              </div>
              
              <textarea 
                style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '12px', borderRadius: '10px', fontSize: '13px', minHeight: '280px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical' }}
                value={promptTeks} onChange={(e) => setPromptTeks(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ width: '35%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setCurrentPage(1)}>⬅ Kembali</button>
                <button style={{ width: '65%', backgroundColor: '#1f6feb', color: '#ffffff', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer' }} onClick={() => setCurrentPage(3)}>Ke Visual Editor ➔</button>
              </div>
            </div>
          )}

          {/* ================= PAGE 3 ================= */}
          {currentPage === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* BAGIAN ATAS: LIVE PREVIEW & SUMBER GAMBAR KANAN */}
              <div style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                  
                  {/* KANVAS KIRI */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#8b949e', textAlign: 'center', letterSpacing: '1px' }}>
                      LIVE PREVIEW (1080 x 1350)
                    </h2>
                    <div style={{ border: '2px dashed #30363d', borderRadius: '10px', padding: '8px', cursor: isDragging ? 'grabbing' : 'grab', backgroundColor: '#161b22' }}>
                      <canvas 
                        ref={canvasRef} width="1080" height="1350" 
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} onWheel={handleWheel}
                        style={{ width: '280px', height: 'auto', borderRadius: '6px', display: 'block', touchAction: 'none' }}
                      ></canvas>
                    </div>
                  </div>

                  {/* BOARD GAMBAR (KANAN) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '280px', marginTop: '28px' }}>
                    <div style={{ backgroundColor: '#161b22', padding: '16px', borderRadius: '10px', border: '1px solid #30363d' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#3fb950', display: 'block', marginBottom: '8px' }}>🖼️ UPLOAD DARI PC/HP</label>
                      <input type="file" accept="image/*" onChange={handleUploadFoto} style={{ fontSize: '11px', color: '#c9d1d9', width: '100%' }} />
                    </div>
                  </div>

                </div>
              </div>

              {/* KONTROL BOARDS BAWAH */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* KOLOM KIRI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* BOARD EDIT TEKS & WARNA */}
                  <div style={{ backgroundColor: '#0d1117', padding: '16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#a371f7', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>📝 EDIT JUDUL</label>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                      <button onClick={() => handleFormat('foreColor', '#E7E820')} style={{ backgroundColor: '#E7E820', color: '#000', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Kuning</button>
                      <button onClick={() => handleFormat('italic')} style={{ backgroundColor: '#21262d', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontStyle: 'italic', cursor: 'pointer', border: '1px solid #30363d' }}>I</button>
                      <div style={{ width: '1px', height: '16px', backgroundColor: '#30363d', margin: '0 4px' }}></div>
                      <button onClick={() => handleFormat('foreColor', '#ffffff')} style={{ backgroundColor: 'transparent', color: '#c9d1d9', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', border: '1px solid #30363d' }}>Teks Dasar</button>
                    </div>

                    <div 
                      id="judul-editor"
                      contentEditable
                      onInput={(e) => setJudulHtml(e.currentTarget.innerHTML)}
                      style={{ width: '100%', backgroundColor: '#161b22', border: '1px solid #30363d', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', minHeight: '110px', outline: 'none', boxSizing: 'border-box', overflowY: 'auto', lineHeight: '1.5' }}
                    />
                  </div>

                  {/* BOARD EDIT SUMBER BERITA */}
                  <div style={{ backgroundColor: '#0d1117', padding: '16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#f78166', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>🔗 SUMBER BERITA</label>
                    <input 
                      type="text" 
                      style={{ width: '100%', backgroundColor: '#161b22', border: '1px solid #30363d', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      value={sumberBerita}
                      onChange={(e) => setSumberBerita(e.target.value)}
                    />
                  </div>

                  {/* BOARD KONTROL SUMBER BERITA */}
                  <div style={{ backgroundColor: '#0d1117', padding: '12px 16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#f78166', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span>📍 KONTROL SUMBER BERITA</span>
                      <button onClick={() => { setSumberX(142); setSumberY(710); setUkuranFontSumber(28); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }} title="Kembalikan ke Setelan Awal">🔄</button>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Ukuran Font</span> <span>{ukuranFontSumber}</span></span>
                        <input type="range" min="15" max="150" step="1" value={ukuranFontSumber} onChange={(e) => setUkuranFontSumber(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#f78166' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser X</span> <span>{sumberX}</span></span>
                          <input type="range" min="0" max="1080" step="1" value={sumberX} onChange={(e) => setSumberX(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#f78166' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser Y</span> <span>{sumberY}</span></span>
                          <input type="range" min="0" max="1350" step="1" value={sumberY} onChange={(e) => setSumberY(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#f78166' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* KOLOM KANAN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* BOARD KONTROL GAMBAR */}
                  <div style={{ backgroundColor: '#0d1117', padding: '12px 16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#3fb950', display: 'block', marginBottom: '8px' }}>🖼️ KONTROL SKALA GAMBAR</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Zoom Skala</span> <span>{imgScale.toFixed(2)}</span></span>
                        <input type="range" min="0.2" max="3" step="0.05" value={imgScale} onChange={(e) => setImgScale(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#3fb950' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser X</span> <span>{imgX}</span></span>
                        <input type="range" min="-1000" max="1000" step="10" value={imgX} onChange={(e) => setImgX(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3fb950' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser Y</span> <span>{imgY}</span></span>
                        <input type="range" min="-1000" max="1000" step="10" value={imgY} onChange={(e) => setImgY(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3fb950' }} />
                      </div>
                    </div>
                  </div>

                  {/* BOARD KONTROL TEKS JUDUL */}
                  <div style={{ backgroundColor: '#0d1117', padding: '12px 16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#a371f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span>✨ KONTROL POSISI JUDUL</span>
                      <button onClick={() => { setTeksX(140); setTeksY(800); setUkuranFont(79); setJarakBaris(1.4); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }} title="Kembalikan ke Setelan Awal">🔄</button>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Ukuran Font</span> <span>{ukuranFont}</span></span>
                        <input type="range" min="30" max="400" step="1" value={ukuranFont} onChange={(e) => setUkuranFont(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#a371f7' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser X</span> <span>{teksX}</span></span>
                        <input type="range" min="-500" max="1080" step="1" value={teksX} onChange={(e) => setTeksX(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#a371f7' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser Y (Atas/Bawah)</span> <span>{teksY}</span></span>
                        <input type="range" min="-500" max="2000" step="1" value={teksY} onChange={(e) => setTeksY(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#a371f7' }} />
                      </div>
                      <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #30363d' }}>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Jarak Antar Kalimat</span> <span>{jarakBaris}</span></span>
                        <input type="range" min="0.8" max="2.5" step="0.1" value={jarakBaris} onChange={(e) => setJarakBaris(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#a371f7' }} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* TOMBOL NAVIGASI BAWAH */}
              <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #30363d', paddingTop: '16px' }}>
                <button style={{ width: '30%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '14px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setCurrentPage(2)}>⬅ Kembali</button>
                <button style={{ width: '70%', backgroundColor: '#238636', color: '#ffffff', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer' }} onClick={downloadGambar}>📥 Download Postingan IG</button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
