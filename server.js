const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const hostname = 'moonshoot.fun';
const httpsPort = 443;
const httpPort = 80;

const server = express();

// Cloudflare ve proxy uyumluluğu için middleware
server.set('trust proxy', true);

// Güvenlik middleware
server.use((req, res, next) => {
  // Güvenlik başlıkları
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cloudflare SSL kontrolü
  const proto = req.get('X-Forwarded-Proto') || req.protocol;
  console.log('Gelen İstek Protokolü:', proto);
  
  next();
});

// Statik dosyaları sunma
server.use(express.static(path.join(__dirname, 'build'), {
  // Statik dosyalar için gelişmiş önbellek kontrolleri
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Tüm rotaları statik HTML'ye yönlendirme
server.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// SSL sertifikası kontrol fonksiyonu
function checkSSLCertificate() {
  try {
    const sslKeyPath = path.join(__dirname, 'ssl/private.key');
    const sslCertPath = path.join(__dirname, 'ssl/certificate.crt');

    console.log('SSL Key Path:', sslKeyPath);
    console.log('SSL Cert Path:', sslCertPath);

    // Dosyaların varlığını ve okunabilirliğini kontrol et
    fs.accessSync(sslKeyPath, fs.constants.R_OK);
    fs.accessSync(sslCertPath, fs.constants.R_OK);

    console.log('✅ SSL Sertifikaları doğrulandı');
    return {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
  } catch (error) {
    console.error('❌ SSL Sertifikası Hatası:', error.message);
    return null;
  }
}

// Sunucu başlatma
const startServer = () => {
  // HTTP Sunucusu
  const httpServer = http.createServer(server);
  httpServer.listen(httpPort, '0.0.0.0', () => {
    console.log(`🌐 HTTP Sunucusu Çalışıyor:`);
    console.log(`   Port: ${httpPort}`);
  });

  // SSL Sertifikası Varsa HTTPS Sunucusu
  try {
    const sslOptions = checkSSLCertificate();
    
    if (sslOptions) {
      const httpsServer = https.createServer(sslOptions, server);
      httpsServer.listen(httpsPort, '0.0.0.0', () => {
        console.log(`🔒 HTTPS Sunucusu Çalışıyor:`);
        console.log(`   Hostname: ${hostname}`);
        console.log(`   Port: ${httpsPort}`);
        console.log(`   URL: https://${hostname}`);
      });
    } else {
      console.warn('⚠️ SSL Sertifikası Bulunamadı. Sadece HTTP üzerinden çalışılıyor.');
    }
  } catch (error) {
    console.error('🚨 HTTPS Sunucu Başlatma Hatası:', error);
  }
};

startServer(); 