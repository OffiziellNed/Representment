"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function Home() {
  const [isExtractMenu, setIsExtractMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("ALTO");
  
  // States untuk menyimpan data
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [altoData, setAltoData] = useState([]);
  const [rintisData, setRintisData] = useState([]);

  // Fungsi untuk handle multiple file upload dan ekstraksi Excel
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

    // Memilah data berdasarkan SWTC code (menangani variasi penulisan header)
    const alto = allParsedData.filter(
      (row) => row["SWTC code"] === "ALT" || row["SWTC Code"] === "ALT" || row["swtc code"] === "ALT"
    );
    const rintis = allParsedData.filter(
      (row) => row["SWTC code"] === "RTS" || row["SWTC Code"] === "RTS" || row["swtc code"] === "RTS"
    );

    setAltoData(alto);
    setRintisData(rintis);
  };

  // Render Tabel dinamis
  const renderTable = (data) => (
    <div className="overflow-x-auto mt-6 bg-white shadow-sm rounded-lg border border-gray-200">
      <table className="min-w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3">No</th>
            <th className="px-4 py-3">Bank Issuer</th>
            <th className="px-4 py-3">Transaction Date</th>
            <th className="px-4 py-3">Reff Nr</th>
            <th className="px-4 py-3">Id Trx</th>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Transaction Amount</th>
            <th className="px-4 py-3">Merchant Name</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Parent Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{index + 1}</td>
                <td className="px-4 py-3">{row["Bank Issuer"] || "-"}</td>
                <td className="px-4 py-3">{row["Transaction Date"] || "-"}</td>
                <td className="px-4 py-3">{row["Reff Nr"] || "-"}</td>
                <td className="px-4 py-3">{row["Id Trx"] || "-"}</td>
                <td className="px-4 py-3">{row["Reference"] || "-"}</td>
                <td className="px-4 py-3">{row["Transaction Amount"] || "-"}</td>
                <td className="px-4 py-3">{row["Merchant Name"] || "-"}</td>
                <td className="px-4 py-3">{row["Reason"] || "-"}</td>
                <td className="px-4 py-3">{row["Parent Name"] || "-"}</td>
                <td className="px-4 py-3">{row["Status"] || "-"}</td>
                <td className="px-4 py-3">{row["Invoice"] || row["invoice"] || "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                Tidak ada data yang sesuai.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-900 p-8">
      
      {/* TAMPILAN AWAL */}
      {!isExtractMenu ? (
        <div className="flex flex-col items-center pt-32">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 tracking-tight">
            Representment
          </h1>
          <button
            onClick={() => setIsExtractMenu(true)}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-md transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M9.5 12.5l5 5"></path>
              <path d="M14.5 12.5l-5 5"></path>
            </svg>
            Extract File Excel
          </button>
        </div>
      ) : (
        
        {/* MENU EXTRACT FILE EXCEL */}
        <div className="max-w-7xl mx-auto pt-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Extract File Excel</h2>
            <button
              onClick={() => {
                setIsExtractMenu(false);
                setAltoData([]);
                setRintisData([]);
                setTotalDataCount(0);
              }}
              className="text-gray-600 hover:text-black underline text-sm"
            >
              Kembali ke Home
            </button>
          </div>

          {/* Area Upload */}
          <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Multiple Excel Files (.xlsx, .xls)
            </label>
            <input
              type="file"
              multiple
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200 transition-all cursor-pointer"
            />
          </div>

          {/* Dashboard Perhitungan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
              <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Data Terkumpul</span>
              <span className="text-3xl font-bold mt-2">{totalDataCount}</span>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center border-t-4 border-t-blue-500">
              <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total ALTO</span>
              <span className="text-3xl font-bold mt-2 text-blue-600">{altoData.length}</span>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center border-t-4 border-t-red-500">
              <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total RINTIS</span>
              <span className="text-3xl font-bold mt-2 text-red-600">{rintisData.length}</span>
            </div>
          </div>

          {/* Sistem Tab ALTO / RINTIS */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("ALTO")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "ALTO"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                ALTO
              </button>
              <button
                onClick={() => setActiveTab("RINTIS")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "RINTIS"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                RINTIS
              </button>
            </nav>
          </div>

          {/* Menampilkan Tabel Berdasarkan Tab Aktif */}
          <div className="mt-4">
            {activeTab === "ALTO" ? renderTable(altoData) : renderTable(rintisData)}
          </div>
          
        </div>
      )}
    </main>
  );
}
