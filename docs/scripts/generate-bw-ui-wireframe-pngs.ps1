Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\diagrams\ui-wireframes"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$black = [System.Drawing.Color]::Black
$white = [System.Drawing.Color]::White
$pen = New-Object System.Drawing.Pen($black, 2)
$thinPen = New-Object System.Drawing.Pen($black, 1)
$brush = New-Object System.Drawing.SolidBrush($black)
$whiteBrush = New-Object System.Drawing.SolidBrush($white)
$fontTitle = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold)
$fontLabel = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
$fontSmall = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Regular)
$fontSmallBold = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)
$fontTiny = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Regular)

function Draw-Text($g, $x, $y, $text, $font = $fontSmall, $center = $false) {
  if ($center) {
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($text, $font, $brush, [single]$x, [single]$y, $fmt)
    $fmt.Dispose()
  } else {
    $g.DrawString($text, $font, $brush, [single]$x, [single]$y)
  }
}

function Draw-Box($g, $x, $y, $w, $h) {
  $g.FillRectangle($whiteBrush, $x, $y, $w, $h)
  $g.DrawRectangle($pen, $x, $y, $w, $h)
}

function Draw-ThinBox($g, $x, $y, $w, $h) {
  $g.FillRectangle($whiteBrush, $x, $y, $w, $h)
  $g.DrawRectangle($thinPen, $x, $y, $w, $h)
}

function Draw-Line($g, $x1, $y1, $x2, $y2) {
  $g.DrawLine($thinPen, $x1, $y1, $x2, $y2)
}

function Draw-Button($g, $x, $y, $w, $label) {
  Draw-Box $g $x $y $w 34
  Draw-Text $g ($x + ($w / 2)) ($y + 9) $label $fontSmallBold $true
}

function Draw-Input($g, $x, $y, $w, $label) {
  Draw-Text $g $x ($y - 18) $label $fontTiny
  Draw-ThinBox $g $x $y $w 34
}

function New-Canvas($title) {
  $bmp = New-Object System.Drawing.Bitmap(960, 680)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear($white)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  Draw-Text $g 480 18 $title $fontTitle $true
  Draw-Box $g 70 70 820 560
  Draw-Box $g 70 70 820 42
  $g.DrawEllipse($thinPen, 90, 86, 10, 10)
  $g.DrawEllipse($thinPen, 110, 86, 10, 10)
  $g.DrawEllipse($thinPen, 130, 86, 10, 10)
  Draw-ThinBox $g 170 82 470 18
  return @{ Bitmap = $bmp; Graphics = $g }
}

function Save-Canvas($canvas, $name) {
  $path = Join-Path $outDir $name
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

$c = New-Canvas "Wireframe 01 - Trang chu cong khai"
$g = $c.Graphics
Draw-Box $g 100 135 760 54
Draw-Text $g 125 157 "LOGO" $fontSmallBold
Draw-Text $g 595 157 "Tin tuc" $fontSmall
Draw-Text $g 660 157 "Dang nhap" $fontSmall
Draw-Button $g 735 146 95 "Dang ky"
Draw-Box $g 100 215 760 150
Draw-Text $g 480 248 "BANNER TUYEN SINH" $fontLabel $true
Draw-Text $g 480 276 "Thong diep gioi thieu chuong trinh va ky tuyen sinh" $fontSmall $true
Draw-Button $g 415 315 130 "Dang ky ngay"
Draw-Text $g 100 410 "Tin tuc / Thong bao cong khai" $fontLabel
Draw-ThinBox $g 100 430 230 120
Draw-ThinBox $g 365 430 230 120
Draw-ThinBox $g 630 430 230 120
Draw-Line $g 120 470 310 470
Draw-Line $g 120 500 285 500
Draw-Line $g 385 470 575 470
Draw-Line $g 385 500 550 500
Draw-Line $g 650 470 840 470
Draw-Line $g 650 500 815 500
Save-Canvas $c "01-home.png"

$c = New-Canvas "Wireframe 02 - Dang nhap"
$g = $c.Graphics
Draw-Box $g 300 155 360 390
Draw-Text $g 480 188 "DANG NHAP" $fontLabel $true
Draw-Input $g 350 245 260 "Email"
Draw-Input $g 350 315 260 "Mat khau"
Draw-Button $g 350 385 260 "Dang nhap"
Draw-Text $g 480 450 "Quen mat khau?" $fontSmall $true
Draw-Text $g 480 482 "Chua co tai khoan? Dang ky" $fontSmall $true
Save-Canvas $c "02-login.png"

$c = New-Canvas "Wireframe 03 - Dang ky va xac thuc OTP"
$g = $c.Graphics
Draw-Box $g 115 150 330 400
Draw-Text $g 280 182 "DANG KY TAI KHOAN" $fontLabel $true
Draw-Input $g 155 235 250 "Ho ten"
Draw-Input $g 155 300 250 "Email"
Draw-Input $g 155 365 250 "So dien thoai"
Draw-Input $g 155 430 250 "Mat khau"
Draw-Button $g 155 495 250 "Gui dang ky"
Draw-Box $g 515 150 330 400
Draw-Text $g 680 182 "XAC THUC OTP" $fontLabel $true
Draw-Text $g 680 230 "Nhap ma OTP da gui qua email" $fontSmall $true
Draw-Input $g 555 285 250 "Ma OTP"
Draw-Button $g 555 355 250 "Xac thuc"
Draw-Button $g 555 420 250 "Gui lai OTP"
Save-Canvas $c "03-register-otp.png"

$c = New-Canvas "Wireframe 04 - Ho so ca nhan"
$g = $c.Graphics
Draw-Box $g 100 135 170 470
Draw-Text $g 185 162 "MENU" $fontLabel $true
Draw-Text $g 130 215 "Tai khoan" $fontSmall
Draw-Text $g 130 250 "Ho so tuyen sinh" $fontSmall
Draw-Text $g 130 285 "Thong bao" $fontSmall
Draw-Box $g 310 135 550 180
Draw-Text $g 335 165 "Thong tin ca nhan" $fontLabel
Draw-Input $g 335 220 220 "Ho ten"
Draw-Input $g 595 220 220 "So dien thoai"
Draw-Button $g 335 275 160 "Luu thay doi"
Draw-Box $g 310 350 550 205
Draw-Text $g 335 380 "Doi mat khau" $fontLabel
Draw-Input $g 335 435 220 "Mat khau hien tai"
Draw-Input $g 595 435 220 "Mat khau moi"
Draw-Button $g 335 500 160 "Doi mat khau"
Save-Canvas $c "04-profile.png"

$c = New-Canvas "Wireframe 05 - Ho so tuyen sinh"
$g = $c.Graphics
Draw-Box $g 100 135 760 55
Draw-Text $g 480 156 "Stepper: Chinh sach > Thanh toan > Thong tin > Thi > Chuong trinh > Ho so goc" $fontSmall $true
Draw-Box $g 100 225 470 330
Draw-Text $g 125 255 "Noi dung buoc hien tai" $fontLabel
Draw-Input $g 125 315 380 "Truong thong tin 1"
Draw-Input $g 125 380 380 "Truong thong tin 2"
Draw-Input $g 125 445 380 "Truong thong tin 3"
Draw-Button $g 125 505 130 "Luu"
Draw-Button $g 275 505 130 "Tiep tuc"
Draw-Box $g 610 225 250 330
Draw-Text $g 735 255 "Trang thai ho so" $fontLabel $true
Draw-Line $g 635 310 835 310
Draw-Line $g 635 350 835 350
Draw-Line $g 635 390 835 390
Draw-Line $g 635 430 835 430
Draw-Text $g 735 500 "Thong bao loi / thanh cong" $fontSmall $true
Save-Canvas $c "05-enrollment.png"

$c = New-Canvas "Wireframe 06 - Thong bao"
$g = $c.Graphics
Draw-Box $g 100 135 170 470
Draw-Text $g 185 162 "MENU" $fontLabel $true
Draw-Text $g 130 215 "Tai khoan" $fontSmall
Draw-Text $g 130 250 "Ho so" $fontSmall
Draw-Text $g 130 285 "Thong bao" $fontSmallBold
Draw-Box $g 310 135 550 470
Draw-Text $g 335 165 "Thong bao cua toi" $fontLabel
Draw-Button $g 685 150 140 "Danh dau tat ca"
Draw-ThinBox $g 335 215 490 70
Draw-ThinBox $g 335 310 490 70
Draw-ThinBox $g 335 405 490 70
Draw-Line $g 360 245 790 245
Draw-Line $g 360 340 790 340
Draw-Line $g 360 435 790 435
Draw-Text $g 580 535 "Trang thai rong / loi tai du lieu neu co" $fontSmall $true
Save-Canvas $c "06-notifications.png"

$c = New-Canvas "Wireframe 07 - Dashboard quan tri"
$g = $c.Graphics
Draw-Box $g 100 135 170 470
Draw-Text $g 185 162 "ADMIN MENU" $fontLabel $true
Draw-Text $g 130 215 "Dashboard" $fontSmallBold
Draw-Text $g 130 250 "Nguoi dung" $fontSmall
Draw-Text $g 130 285 "Ho so" $fontSmall
Draw-Text $g 130 320 "Ky thi / Diem" $fontSmall
Draw-Text $g 130 355 "Noi dung" $fontSmall
Draw-Box $g 310 135 550 90
Draw-Text $g 335 165 "Tong quan thong ke" $fontLabel
Draw-ThinBox $g 310 255 120 80
Draw-ThinBox $g 455 255 120 80
Draw-ThinBox $g 600 255 120 80
Draw-ThinBox $g 745 255 115 80
Draw-Text $g 370 292 "Users" $fontSmall $true
Draw-Text $g 515 292 "Ho so" $fontSmall $true
Draw-Text $g 660 292 "Doanh thu" $fontSmall $true
Draw-Text $g 802 292 "Cho xu ly" $fontSmall $true
Draw-Box $g 310 370 550 185
Draw-Text $g 585 402 "Bieu do / bang tong quan" $fontLabel $true
Draw-Line $g 340 455 830 455
Draw-Line $g 340 495 830 495
Save-Canvas $c "07-admin-dashboard.png"

$c = New-Canvas "Wireframe 08 - Man hinh quan ly admin"
$g = $c.Graphics
Draw-Box $g 100 135 170 470
Draw-Text $g 185 162 "ADMIN MENU" $fontLabel $true
Draw-Text $g 130 215 "Nguoi dung" $fontSmall
Draw-Text $g 130 250 "Ho so" $fontSmall
Draw-Text $g 130 285 "Ky thi" $fontSmall
Draw-Text $g 130 320 "Diem thi" $fontSmall
Draw-Text $g 130 355 "Noi dung" $fontSmall
Draw-Box $g 310 135 550 60
Draw-Text $g 335 164 "Tieu de module quan ly" $fontLabel
Draw-Button $g 650 148 80 "Them"
Draw-Button $g 750 148 80 "Export"
Draw-Box $g 310 220 550 65
Draw-Text $g 335 250 "Bo loc / Tim kiem / Trang thai / Ngay" $fontSmall
Draw-Box $g 310 315 550 240
Draw-Text $g 335 345 "Bang du lieu" $fontLabel
Draw-Line $g 335 385 835 385
Draw-Line $g 335 425 835 425
Draw-Line $g 335 465 835 465
Draw-Line $g 335 505 835 505
Draw-Text $g 585 585 "Cot hanh dong: xem / sua / khoa / xoa mem" $fontSmall $true
Save-Canvas $c "08-admin-management.png"

Write-Host "Generated PNG wireframes in $outDir"
