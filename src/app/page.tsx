  async function handlePrint() {
    const logoB64 = getLogoCached()
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>${noticia.titulo}</title>
      <style>
        @page{margin:0.5in;size:letter}
        * { margin:0; padding:0; }
        body{
          font-family:Georgia,serif;
          color:#333;
          max-width:700px;
          margin:auto;
          padding:20px;
          position:relative;
        }
        /* Marca de agua GIGANTE en toda la página */
        body::before {
          content:'';
          position:fixed;
          top:50%;
          left:50%;
          transform:translate(-50%,-50%) rotate(-45deg);
          width:1200px;
          height:1200px;
          background-image:url('${logoB64}');
          background-repeat:no-repeat;
          background-position:center;
          background-size:800px 800px;
          opacity:0.15;
          pointer-events:none;
          z-index:0;
          print-color-adjust:exact;
          -webkit-print-color-adjust:exact;
        }
        .imagen{margin:0 auto 24px;text-align:center;position:relative;z-index:10}
        .imagen img{max-width:100%;max-height:300px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.12)}
        h1{text-align:center;color:#b8860b;font-size:22px;margin:0 0 8px;position:relative;z-index:10}
        .linea{margin:0 auto 20px;width:80%;height:1px;background:#b8860b;position:relative;z-index:10}
        .content{white-space:pre-wrap;line-height:1.9;font-size:14px;margin-top:16px;position:relative;z-index:10}
        .footer{text-align:center;margin-top:40px;font-size:12px;color:#999;border-top:1px solid #ddd;padding-top:12px;position:relative;z-index:10}
        @media print {
          body::before {
            opacity:0.15 !important;
            print-color-adjust:exact !important;
            -webkit-print-color-adjust:exact !important;
          }
        }
      </style></head><body>
      ${noticia.imagenUrl ? `<div class="imagen"><img src="${noticia.imagenUrl}" alt=""/></div>` : ''}
      <h1>${noticia.titulo}</h1>
      <div class="linea"></div>
      <div class="content">${noticia.mensaje}</div>
      ${noticia.videoUrl ? `<p style="text-align:center;margin-top:20px;position:relative;z-index:10"><a href="${noticia.videoUrl}" style="color:#b8860b">Ver video relacionado</a></p>` : ''}
      <div class="footer">
        <p>Iglesia Espíritu Santo y Fuego — Misión Cristiana Perfectos en Unidad</p>
        <p>Impreso desde la página oficial</p>
      </div>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 800)
  }