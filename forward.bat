@echo off
chcp 65001 >nul
for /f "tokens=1" %%a in ('wsl hostname -I') do set WSL_IP=%%a
echo WSL IP: %WSL_IP%
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=%WSL_IP%
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%WSL_IP%
echo 端口转发已设置
echo 请访问 http://localhost:3000
pause
