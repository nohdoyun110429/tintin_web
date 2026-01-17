$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 프로젝트 경로 설정
$projectPath = "C:\Users\tinti\OneDrive\바탕 화면\tintin_web-main"

# Git 사용자 정보 설정
git config --global user.name "nohdoyun110429"
git config --global user.email "nohdoyun110429@gmail.com"

# 프로젝트 디렉토리로 이동
Set-Location $projectPath

# Git 초기화 확인 및 원격 저장소 설정
if (-not (Test-Path ".git")) {
    git init
}

# 원격 저장소 확인 및 추가
$remoteUrl = "https://github.com/nohdoyun110429/tintin_web.git"
$existingRemote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin $remoteUrl
} elseif ($existingRemote -ne $remoteUrl) {
    git remote set-url origin $remoteUrl
}

# 모든 파일 추가
git add .

# 커밋
git commit -m "Add payment functionality with Toss Payments integration and Supabase Edge Function"

# 푸시
git push -u origin master

Write-Host "완료되었습니다!"

