# WSL 端口转发脚本
# 在 Windows PowerShell (管理员) 中运行

$wslIp = (wsl hostname -I).Trim().Split()[0]
Write-Host "WSL IP: $wslIp"

# 删除旧规则
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 2>$null

# 添加新规则
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIp

# 允许防火墙
New-NetFirewallRule -DisplayName "WSL2 Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "WSL2 Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host "✅ 端口转发已设置"
Write-Host "现在可以在 Windows 浏览器访问:"
Write-Host "  http://localhost:3000"
netsh interface portproxy show all
