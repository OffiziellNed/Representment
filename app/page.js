// app/page.js

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center pt-32 bg-gray-50 text-gray-900 font-sans">
      
      {/* Bagian Judul */}
      <h1 className="text-4xl md:text-5xl font-extrabold mb-12 tracking-tight text-slate-800">
        Representment
      </h1>

      {/* Bagian Menu / Tombol */}
      <div className="w-full max-w-md flex flex-col items-center px-4">
        <button 
          className="group w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-5 rounded-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 active:scale-95"
        >
          {/* Icon Excel (SVG Murni) */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transition-transform duration-300 group-hover:scale-110"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M9.5 12.5l5 5"></path>
            <path d="M14.5 12.5l-5 5"></path>
          </svg>
          
          <span className="font-semibold text-lg tracking-wide">
            Extract File Excel
          </span>
        </button>
      </div>

    </main>
  );
}
