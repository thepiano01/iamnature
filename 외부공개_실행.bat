@echo off
chcp 65001 >nul
title 나는 자연산이다 - 외부 공개
cd /d "%~dp0"

echo.
echo ===== 나는 자연산이다 : 외부 공개 실행 =====
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js가 설치되어 있지 않습니다.
  echo     https://nodejs.org 에서 LTS 버전을 설치한 뒤 이 파일을 다시 실행하세요.
  start https://nodejs.org
  pause
  exit /b 1
)

if not exist ".env" (
  echo [1/5] 환경설정 파일 만드는 중...
  powershell -NoProfile -Command "$s=([guid]::NewGuid().ToString('N'))+([guid]::NewGuid().ToString('N')); Set-Content -Encoding ascii .env ('DATABASE_URL=\"file:./dev.db\"', ('JWT_SECRET=\"'+$s+'\"'))"
)

if not exist "node_modules" (
  echo [2/5] 패키지 설치 중... (처음 한 번, 몇 분 걸려요)
  call npm install
  if errorlevel 1 goto fail
)

echo [3/5] 데이터베이스 준비 중...
call npx prisma db push --skip-generate
if errorlevel 1 goto fail
call npx prisma generate >nul
call npm run db:seed

echo [4/5] 사이트 빌드 중... (1~2분)
call npm run build
if errorlevel 1 goto fail

echo [5/5] 사이트 시작 + 외부 주소 만드는 중...
rem 3000번부터 비어 있는 포트를 찾습니다 (다른 프로그램과 겹치지 않게)
set PORT=3000
:findport
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a PORT=PORT+1
  goto findport
)
echo     사용할 포트: %PORT%
start "iamnature 서버 %PORT% (이 창을 닫으면 사이트가 꺼집니다)" cmd /k "npx next start -p %PORT%"
timeout /t 8 >nul

echo.
echo ------------------------------------------------------------
echo  잠시 후 아래에 https://xxxx.trycloudflare.com 주소가 나옵니다.
echo  그 주소를 휴대폰에서 열면 됩니다.
echo  * 이 창과 서버 창을 닫으면 외부 접속이 끊깁니다.
echo  * 다시 실행할 때마다 주소가 바뀝니다.
echo ------------------------------------------------------------
echo.
call npx -y cloudflared tunnel --url http://localhost:%PORT%
pause
exit /b 0

:fail
echo.
echo [!] 오류가 발생했습니다. 위 메시지를 캡처해서 Claude에게 보여주세요.
pause
exit /b 1
