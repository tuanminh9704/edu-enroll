const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'diagrams', 'ui-wireframes');
fs.mkdirSync(outDir, { recursive: true });

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const line = (x1, y1, x2, y2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="line"/>`;

const rect = (x, y, w, h, cls = 'box') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;

const text = (x, y, value, cls = 'small', anchor = 'start') =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;

const button = (x, y, w, label) => [
  rect(x, y, w, 34, 'button'),
  text(x + w / 2, y + 22, label, 'smallBold', 'middle'),
].join('\n');

const input = (x, y, w, label) => [
  text(x, y - 8, label, 'tiny'),
  rect(x, y, w, 34, 'box'),
].join('\n');

const browser = (title, body, file) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="680" viewBox="0 0 960 680" role="img">
  <defs>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; fill: #000; }
      .page { fill: #fff; stroke: #000; stroke-width: 2; }
      .chrome { fill: #fff; stroke: #000; stroke-width: 2; }
      .box { fill: #fff; stroke: #000; stroke-width: 1.6; rx: 4; }
      .button { fill: #fff; stroke: #000; stroke-width: 2; rx: 4; }
      .line { stroke: #000; stroke-width: 1.5; }
      .dash { stroke: #000; stroke-width: 1.4; stroke-dasharray: 6 5; fill: none; }
      .title { font-size: 22px; font-weight: 700; }
      .label { font-size: 16px; font-weight: 700; }
      .smallBold { font-size: 13px; font-weight: 700; }
      .small { font-size: 13px; }
      .tiny { font-size: 11px; }
    </style>
  </defs>
  <rect width="960" height="680" fill="#fff"/>
  <text x="480" y="38" class="title" text-anchor="middle">${esc(title)}</text>
  <rect x="70" y="70" width="820" height="560" class="page"/>
  <rect x="70" y="70" width="820" height="42" class="chrome"/>
  <circle cx="94" cy="91" r="5" fill="#fff" stroke="#000" stroke-width="1.5"/>
  <circle cx="114" cy="91" r="5" fill="#fff" stroke="#000" stroke-width="1.5"/>
  <circle cx="134" cy="91" r="5" fill="#fff" stroke="#000" stroke-width="1.5"/>
  <rect x="170" y="82" width="470" height="18" class="box"/>
  ${body}
</svg>
`;
  fs.writeFileSync(path.join(outDir, file), svg, 'utf8');
};

browser('Wireframe 01 - Trang chu cong khai', `
  ${rect(100, 135, 760, 54)}
  ${text(125, 167, 'LOGO', 'smallBold')}
  ${text(595, 167, 'Tin tuc', 'small')}
  ${text(660, 167, 'Dang nhap', 'small')}
  ${button(735, 146, 95, 'Dang ky')}

  ${rect(100, 215, 760, 150)}
  ${text(480, 260, 'BANNER TUYEN SINH', 'label', 'middle')}
  ${text(480, 288, 'Thong diep gioi thieu chuong trinh va ky tuyen sinh', 'small', 'middle')}
  ${button(415, 315, 130, 'Dang ky ngay')}

  ${text(100, 410, 'Tin tuc / Thong bao cong khai', 'label')}
  ${rect(100, 430, 230, 120)}
  ${rect(365, 430, 230, 120)}
  ${rect(630, 430, 230, 120)}
  ${line(120, 470, 310, 470)}
  ${line(120, 500, 285, 500)}
  ${line(385, 470, 575, 470)}
  ${line(385, 500, 550, 500)}
  ${line(650, 470, 840, 470)}
  ${line(650, 500, 815, 500)}
`, '01-home.svg');

browser('Wireframe 02 - Dang nhap', `
  ${rect(300, 155, 360, 390)}
  ${text(480, 200, 'DANG NHAP', 'label', 'middle')}
  ${input(350, 245, 260, 'Email')}
  ${input(350, 315, 260, 'Mat khau')}
  ${button(350, 385, 260, 'Dang nhap')}
  ${text(480, 450, 'Quen mat khau?', 'small', 'middle')}
  ${text(480, 482, 'Chua co tai khoan? Dang ky', 'small', 'middle')}
`, '02-login.svg');

browser('Wireframe 03 - Dang ky va xac thuc OTP', `
  ${rect(115, 150, 330, 400)}
  ${text(280, 190, 'DANG KY TAI KHOAN', 'label', 'middle')}
  ${input(155, 235, 250, 'Ho ten')}
  ${input(155, 300, 250, 'Email')}
  ${input(155, 365, 250, 'So dien thoai')}
  ${input(155, 430, 250, 'Mat khau')}
  ${button(155, 495, 250, 'Gui dang ky')}

  ${rect(515, 150, 330, 400)}
  ${text(680, 190, 'XAC THUC OTP', 'label', 'middle')}
  ${text(680, 230, 'Nhap ma OTP da gui qua email', 'small', 'middle')}
  ${input(555, 285, 250, 'Ma OTP')}
  ${button(555, 355, 250, 'Xac thuc')}
  ${button(555, 420, 250, 'Gui lai OTP')}
`, '03-register-otp.svg');

browser('Wireframe 04 - Ho so ca nhan', `
  ${rect(100, 135, 170, 470)}
  ${text(185, 170, 'MENU', 'label', 'middle')}
  ${text(130, 215, 'Tai khoan', 'small')}
  ${text(130, 250, 'Ho so tuyen sinh', 'small')}
  ${text(130, 285, 'Thong bao', 'small')}

  ${rect(310, 135, 550, 180)}
  ${text(335, 175, 'Thong tin ca nhan', 'label')}
  ${input(335, 220, 220, 'Ho ten')}
  ${input(595, 220, 220, 'So dien thoai')}
  ${button(335, 275, 160, 'Luu thay doi')}

  ${rect(310, 350, 550, 205)}
  ${text(335, 390, 'Doi mat khau', 'label')}
  ${input(335, 435, 220, 'Mat khau hien tai')}
  ${input(595, 435, 220, 'Mat khau moi')}
  ${button(335, 500, 160, 'Doi mat khau')}
`, '04-profile.svg');

browser('Wireframe 05 - Ho so tuyen sinh', `
  ${rect(100, 135, 760, 55)}
  ${text(480, 168, 'Stepper: Chinh sach > Thanh toan > Thong tin > Thi > Chuong trinh > Ho so goc', 'small', 'middle')}

  ${rect(100, 225, 470, 330)}
  ${text(125, 265, 'Noi dung buoc hien tai', 'label')}
  ${input(125, 315, 380, 'Truong thong tin 1')}
  ${input(125, 380, 380, 'Truong thong tin 2')}
  ${input(125, 445, 380, 'Truong thong tin 3')}
  ${button(125, 505, 130, 'Luu')}
  ${button(275, 505, 130, 'Tiep tuc')}

  ${rect(610, 225, 250, 330)}
  ${text(735, 265, 'Trang thai ho so', 'label', 'middle')}
  ${line(635, 310, 835, 310)}
  ${line(635, 350, 835, 350)}
  ${line(635, 390, 835, 390)}
  ${line(635, 430, 835, 430)}
  ${text(735, 500, 'Thong bao loi / thanh cong', 'small', 'middle')}
`, '05-enrollment.svg');

browser('Wireframe 06 - Thong bao', `
  ${rect(100, 135, 170, 470)}
  ${text(185, 170, 'MENU', 'label', 'middle')}
  ${text(130, 215, 'Tai khoan', 'small')}
  ${text(130, 250, 'Ho so', 'small')}
  ${text(130, 285, 'Thong bao', 'smallBold')}

  ${rect(310, 135, 550, 470)}
  ${text(335, 175, 'Thong bao cua toi', 'label')}
  ${button(685, 150, 140, 'Danh dau tat ca')}
  ${rect(335, 215, 490, 70)}
  ${rect(335, 310, 490, 70)}
  ${rect(335, 405, 490, 70)}
  ${line(360, 245, 790, 245)}
  ${line(360, 340, 790, 340)}
  ${line(360, 435, 790, 435)}
  ${text(580, 535, 'Trang thai rong / loi tai du lieu neu co', 'small', 'middle')}
`, '06-notifications.svg');

browser('Wireframe 07 - Dashboard quan tri', `
  ${rect(100, 135, 170, 470)}
  ${text(185, 170, 'ADMIN MENU', 'label', 'middle')}
  ${text(130, 215, 'Dashboard', 'smallBold')}
  ${text(130, 250, 'Nguoi dung', 'small')}
  ${text(130, 285, 'Ho so', 'small')}
  ${text(130, 320, 'Ky thi / Diem', 'small')}
  ${text(130, 355, 'Noi dung', 'small')}

  ${rect(310, 135, 550, 90)}
  ${text(335, 175, 'Tong quan thong ke', 'label')}
  ${rect(310, 255, 120, 80)}
  ${rect(455, 255, 120, 80)}
  ${rect(600, 255, 120, 80)}
  ${rect(745, 255, 115, 80)}
  ${text(370, 300, 'Users', 'small', 'middle')}
  ${text(515, 300, 'Ho so', 'small', 'middle')}
  ${text(660, 300, 'Doanh thu', 'small', 'middle')}
  ${text(802, 300, 'Cho xu ly', 'small', 'middle')}
  ${rect(310, 370, 550, 185)}
  ${text(585, 410, 'Bieu do / bang tong quan', 'label', 'middle')}
  ${line(340, 455, 830, 455)}
  ${line(340, 495, 830, 495)}
`, '07-admin-dashboard.svg');

browser('Wireframe 08 - Man hinh quan ly admin', `
  ${rect(100, 135, 170, 470)}
  ${text(185, 170, 'ADMIN MENU', 'label', 'middle')}
  ${text(130, 215, 'Nguoi dung', 'small')}
  ${text(130, 250, 'Ho so', 'small')}
  ${text(130, 285, 'Ky thi', 'small')}
  ${text(130, 320, 'Diem thi', 'small')}
  ${text(130, 355, 'Noi dung', 'small')}

  ${rect(310, 135, 550, 60)}
  ${text(335, 172, 'Tieu de module quan ly', 'label')}
  ${button(650, 148, 80, 'Them')}
  ${button(750, 148, 80, 'Export')}

  ${rect(310, 220, 550, 65)}
  ${text(335, 258, 'Bo loc / Tim kiem / Trang thai / Ngay', 'small')}

  ${rect(310, 315, 550, 240)}
  ${text(335, 350, 'Bang du lieu', 'label')}
  ${line(335, 385, 835, 385)}
  ${line(335, 425, 835, 425)}
  ${line(335, 465, 835, 465)}
  ${line(335, 505, 835, 505)}
  ${text(585, 585, 'Cot hanh dong: xem / sua / khoa / xoa mem', 'small', 'middle')}
`, '08-admin-management.svg');

console.log(`Generated black-white UI wireframes in ${outDir}`);
