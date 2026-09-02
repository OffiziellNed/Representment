"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function RepresentmentPortal() {
  const [activeTab, setActiveTab] = useState("ALTO");
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [altoData, setAltoData] = useState([]);
  const [rintisData, setRintisData] = useState([]);

  // Fungsi untuk membaca dan memilah file Excel
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

    const alto = [];
    const rintis = [];

    // Looping untuk mencari SWTC Code dengan metode yang kebal terhadap spasi/typo header
    allParsedData.forEach((row) => {
      const swtcKey = Object.keys(row).find(key => key.trim().toLowerCase() === 'swtc code');
      
      if (swtcKey) {
        const val = String(row[swtcKey]).trim().toUpperCase();
        if (val === 'ALT') {
          alto.push(row);
        } else if (val === 'RTS') {
          rintis.push(row);
        }
      }
    });

    setAltoData(alto);
    setRintisData(rintis);
  };

  // Helper agar data di kolom tetap terbaca meskipun nama header di Excel ada spasi tersembunyi
  const getColVal = (row, colName) => {
    const key = Object.keys(row).find(k => k.trim().toLowerCase() === colName.toLowerCase());
    return key && row[key] ? row[key] : "-";
  };

  const renderTable = (data) => (
    <div style={{ marginTop: '20px', borderRadius: '8px', border: '1px solid #30363d', backgroundColor: '#0d1117', width: '100%' }}>
      {/* Table ramping tanpa scroll samping */}
      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', color: '#c9d1d9', fontSize: '10px', textAlign: 'left', wordWrap: 'break-word' }}>
        <thead style={{ backgroundColor: '#21262d', borderBottom: '1px solid #30363d' }}>
          <tr>
            <th style={{ padding: '8px 4px', width: '3%' }}>No</th>
            <th style={{ padding: '8px 4px', width: '8%' }}>Bank Issuer</th>
            <th style={{ padding: '8px 4px', width: '8%' }}>Trx Date</th>
            <th style={{ padding: '8px 4px', width: '9%' }}>Reff Nr</th>
            <th style={{ padding: '8px 4px', width: '9%' }}>Id Trx</th>
            <th style={{ padding: '8px 4px', width: '9%' }}>Reference</th>
            <th style={{ padding: '8px 4px', width: '8%' }}>Amount</th>
            <th style={{ padding: '8px 4px', width: '10%' }}>Merchant Name</th>
            <th style={{ padding: '8px 4px', width: '10%' }}>Reason</th>
            <th style={{ padding: '8px 4px', width: '10%' }}>Parent Name</th>
            <th style={{ padding: '8px 4px', width: '8%' }}>Status</th>
            <th style={{ padding: '8px 4px', width: '8%' }}>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #30363d' }}>
                <td style={{ padding: '6px 4px', color: '#ffffff', fontWeight: 'bold' }}>{index + 1}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Bank Issuer")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Transaction Date")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Reff Nr")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Id Trx")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Reference")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Transaction Amount")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Merchant Name")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Reason")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Parent Name")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Status")}</td>
                <td style={{ padding: '6px 4px' }}>{getColVal(row, "Invoice")}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" style={{ padding: '20px', textAlign: 'center', color: '#8b949e', fontSize: '12px' }}>
                Tidak ada data yang sesuai.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '1px', color: '#ffffff', margin: 0 }}>
          📊 REPRESENTMENT
        </h1>
      </div>

      {/* DASHBOARD UTAMA */}
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
              style={{ color: '#c9d1d9', fontSize: '13px', width: '100%', cursor: 'pointer' }}
            />
        </div>

        {/* Indikator Hitungan */}
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

        {/* Tab Filter ALTO / RINTIS */}
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

        {/* Tampilkan Tabel Sesuai Tab Aktif */}
        {activeTab === "ALTO" ? renderTable(altoData) : renderTable(rintisData)}

      </div>
    </div>
  );
}
