@echo off
set OPENSSL_CONF=C:\xampp\apache\conf\openssl.cnf
C:\xampp\apache\bin\openssl.exe req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private.key -out certificate.crt -subj "/CN=jest.bet"
pause 