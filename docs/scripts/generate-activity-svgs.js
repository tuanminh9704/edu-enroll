const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'diagrams');

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const wrap = (text, max = 24) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const nodeCenter = (node) => ({
  x: node.x + node.w / 2,
  y: node.y + node.h / 2,
});

const edgePoint = (node, side) => {
  if (side === 'top') return { x: node.x + node.w / 2, y: node.y };
  if (side === 'bottom') return { x: node.x + node.w / 2, y: node.y + node.h };
  if (side === 'left') return { x: node.x, y: node.y + node.h / 2 };
  return { x: node.x + node.w, y: node.y + node.h / 2 };
};

const renderText = (text, x, y, options = {}) => {
  const lines = wrap(text, options.max || 24);
  const fontSize = options.fontSize || 14;
  const lineHeight = fontSize + 4;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  return lines.map((line, index) =>
    `<text x="${x}" y="${startY + index * lineHeight}" text-anchor="middle" class="${options.className || 'label'}">${esc(line)}</text>`
  ).join('\n');
};

const renderNode = (node) => {
  const label = renderText(node.label, node.x + node.w / 2, node.y + node.h / 2 + 5, {
    max: node.max || 24,
    className: node.type === 'terminal' ? 'terminalText' : 'label',
  });

  if (node.type === 'terminal') {
    return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="${node.h / 2}" class="terminal"/>\n${label}`;
  }

  if (node.type === 'decision') {
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    return `<path d="M ${cx} ${node.y} L ${node.x + node.w} ${cy} L ${cx} ${node.y + node.h} L ${node.x} ${cy} Z" class="decision"/>\n${label}`;
  }

  const cls = node.type === 'error' ? 'error' : 'node';
  return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="10" class="${cls}"/>\n${label}`;
};

const renderEdge = (from, to, label = '', fromSide = 'bottom', toSide = 'top', via = []) => {
  const start = edgePoint(from, fromSide);
  const end = edgePoint(to, toSide);
  const points = [start, ...via, end];
  const d = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const mid = points[Math.floor(points.length / 2)];
  const text = label
    ? `<text x="${mid.x + 14}" y="${mid.y - 8}" class="branchText">${esc(label)}</text>`
    : '';
  return `<path d="${d}" class="edge"/>\n${text}`;
};

const makeNodes = (items) => Object.fromEntries(items.map((node) => [node.id, node]));

const draw = ({ title, subtitle, file, width, height, nodes, edges }) => {
  const map = makeNodes(nodes);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155"/>
    </marker>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; fill: #111827; }
      .title { font-size: 28px; font-weight: 700; }
      .subtitle { font-size: 15px; fill: #475569; }
      .node { fill: #eff6ff; stroke: #2563eb; stroke-width: 2; }
      .decision { fill: #fff7ed; stroke: #ea580c; stroke-width: 2; }
      .error { fill: #fef2f2; stroke: #dc2626; stroke-width: 2; }
      .terminal { fill: #111827; stroke: #111827; stroke-width: 2; }
      .terminalText { fill: #fff; font-size: 14px; font-weight: 700; }
      .label { font-size: 14px; font-weight: 600; }
      .branchText { font-size: 13px; fill: #334155; font-weight: 700; }
      .edge { stroke: #334155; stroke-width: 2; fill: none; marker-end: url(#arrow); }
    </style>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
  <text x="${width / 2}" y="45" text-anchor="middle" class="title">${esc(title)}</text>
  <text x="${width / 2}" y="72" text-anchor="middle" class="subtitle">${esc(subtitle)}</text>
  ${edges.map((edge) => renderEdge(map[edge.from], map[edge.to], edge.label, edge.fromSide, edge.toSide, edge.via)).join('\n')}
  ${nodes.map(renderNode).join('\n')}
</svg>
`;

  fs.writeFileSync(path.join(outDir, file), svg, 'utf8');
};

const box = (id, label, x, y, type = 'node', w = 250, h = 68) => ({ id, label, x, y, w, h, type });
const dec = (id, label, x, y) => box(id, label, x, y, 'decision', 230, 110);
const term = (id, label, x, y) => box(id, label, x, y, 'terminal', 150, 44);
const err = (id, label, x, y) => box(id, label, x, y, 'error', 250, 68);

draw({
  title: 'Activity Diagram - Xem noi dung cong khai',
  subtitle: 'UC01 - Trang chu, banner va tin tuc public',
  file: '20-public-content-activity.svg',
  width: 1180,
  height: 1180,
  nodes: [
    term('start', 'Bat dau', 515, 105),
    box('visit', 'Nguoi dung truy cap trang chu', 465, 185),
    box('request', 'Frontend yeu cau banner va tin tuc cong khai', 465, 285),
    dec('api', 'API hoac CSDL loi?', 475, 395),
    box('query', 'Truy van banner active va tin tuc published', 465, 550),
    dec('has', 'Co du lieu cong khai?', 475, 655),
    box('show', 'Hien thi banner va tin tuc', 220, 815),
    box('empty', 'Hien thi noi dung mac dinh hoac danh sach rong', 710, 815),
    dec('open', 'Mo chi tiet tin tuc?', 475, 925),
    box('news', 'Truy van tin tuc theo slug', 465, 1060),
    err('error', 'Hien thi thong bao loi', 840, 430),
    err('notfound', 'Thong bao tin tuc khong ton tai', 840, 1045),
    term('end', 'Ket thuc', 515, 1125),
  ],
  edges: [
    { from: 'start', to: 'visit' },
    { from: 'visit', to: 'request' },
    { from: 'request', to: 'api' },
    { from: 'api', to: 'error', label: 'Co', fromSide: 'right', toSide: 'left' },
    { from: 'api', to: 'query', label: 'Khong' },
    { from: 'query', to: 'has' },
    { from: 'has', to: 'show', label: 'Co', fromSide: 'left', toSide: 'top' },
    { from: 'has', to: 'empty', label: 'Khong', fromSide: 'right', toSide: 'top' },
    { from: 'show', to: 'open', fromSide: 'bottom', toSide: 'left' },
    { from: 'empty', to: 'open', fromSide: 'bottom', toSide: 'right' },
    { from: 'open', to: 'end', label: 'Khong' },
    { from: 'open', to: 'news', label: 'Co' },
    { from: 'news', to: 'end', label: 'Tin hop le' },
    { from: 'news', to: 'notfound', label: 'Khong hop le', fromSide: 'right', toSide: 'left' },
    { from: 'error', to: 'end', fromSide: 'bottom', toSide: 'right' },
    { from: 'notfound', to: 'end', fromSide: 'bottom', toSide: 'right' },
  ],
});

draw({
  title: 'Activity Diagram - Dang ky, dang nhap va quan ly tai khoan',
  subtitle: 'UC02, UC03 - Xac thuc nguoi dung va cap nhat tai khoan',
  file: '21-auth-account-activity.svg',
  width: 1280,
  height: 1440,
  nodes: [
    term('start', 'Bat dau', 565, 105),
    dec('choose', 'Nguoi dung chon chuc nang', 525, 180),
    box('register', 'Dang ky tai khoan', 150, 350),
    dec('email', 'Email da ton tai?', 160, 455),
    box('create', 'Tao tai khoan cho xac thuc va gui OTP', 150, 610),
    dec('otp', 'OTP hop le?', 160, 730),
    box('activate', 'Kich hoat tai khoan', 150, 885),
    box('login', 'Dang nhap bang email va mat khau', 515, 350),
    dec('loginValid', 'Thong tin dang nhap hop le?', 525, 455),
    dec('active', 'Tai khoan active?', 525, 610),
    box('tokens', 'Tao token va chuyen huong theo vai tro', 515, 765),
    box('manage', 'Mo trang quan ly tai khoan', 880, 350),
    dec('token', 'Token hop le?', 890, 455),
    dec('manageAction', 'Chon thao tac?', 890, 610),
    dec('profileValid', 'Du lieu cap nhat hop le?', 720, 780),
    box('saveProfile', 'Luu thong tin tai khoan', 720, 935),
    dec('passValid', 'Mat khau hop le?', 1040, 780),
    box('savePass', 'Luu mat khau moi va vo hieu token cu', 1040, 935),
    err('error', 'Hien thi thong bao loi', 515, 1080),
    term('end', 'Ket thuc', 565, 1260),
  ],
  edges: [
    { from: 'start', to: 'choose' },
    { from: 'choose', to: 'register', label: 'Dang ky', fromSide: 'left', toSide: 'top' },
    { from: 'register', to: 'email' },
    { from: 'email', to: 'error', label: 'Co', fromSide: 'right', toSide: 'left' },
    { from: 'email', to: 'create', label: 'Khong' },
    { from: 'create', to: 'otp' },
    { from: 'otp', to: 'activate', label: 'Co' },
    { from: 'otp', to: 'error', label: 'Khong', fromSide: 'right', toSide: 'left' },
    { from: 'activate', to: 'end', fromSide: 'bottom', toSide: 'left' },
    { from: 'choose', to: 'login', label: 'Dang nhap' },
    { from: 'login', to: 'loginValid' },
    { from: 'loginValid', to: 'error', label: 'Khong', fromSide: 'bottom', toSide: 'top' },
    { from: 'loginValid', to: 'active', label: 'Co' },
    { from: 'active', to: 'error', label: 'Khong', fromSide: 'bottom', toSide: 'top' },
    { from: 'active', to: 'tokens', label: 'Co' },
    { from: 'tokens', to: 'end' },
    { from: 'choose', to: 'manage', label: 'Quan ly TK', fromSide: 'right', toSide: 'top' },
    { from: 'manage', to: 'token' },
    { from: 'token', to: 'error', label: 'Khong', fromSide: 'left', toSide: 'right' },
    { from: 'token', to: 'manageAction', label: 'Co' },
    { from: 'manageAction', to: 'profileValid', label: 'Cap nhat', fromSide: 'left', toSide: 'top' },
    { from: 'profileValid', to: 'saveProfile', label: 'Co' },
    { from: 'profileValid', to: 'error', label: 'Khong', fromSide: 'left', toSide: 'right' },
    { from: 'saveProfile', to: 'end', fromSide: 'bottom', toSide: 'right' },
    { from: 'manageAction', to: 'passValid', label: 'Doi MK', fromSide: 'right', toSide: 'top' },
    { from: 'passValid', to: 'savePass', label: 'Co' },
    { from: 'passValid', to: 'error', label: 'Khong', fromSide: 'left', toSide: 'right' },
    { from: 'savePass', to: 'end', fromSide: 'bottom', toSide: 'right' },
    { from: 'error', to: 'end' },
  ],
});

draw({
  title: 'Activity Diagram - Lap va hoan tat ho so tuyen sinh',
  subtitle: 'UC04 - UC08 - Chinh sach, thanh toan, thi dau vao, chuong trinh va ho so goc',
  file: '22-student-enrollment-activity.svg',
  width: 1200,
  height: 1620,
  nodes: [
    term('start', 'Bat dau', 525, 105),
    box('login', 'Nguoi dung dang nhap va mo ho so tuyen sinh', 475, 185),
    dec('has', 'Da co ho so?', 485, 295),
    box('create', 'Khoi tao ho so moi neu chua co', 475, 445),
    box('policy', 'Ky chinh sach tuyen sinh', 475, 545),
    dec('signed', 'Da ky chinh sach?', 485, 650),
    box('payment', 'Thanh toan le phi qua VNPay', 475, 805),
    dec('paid', 'Thanh toan thanh cong?', 485, 910),
    box('form', 'Nhap thong tin tuyen sinh', 475, 1065),
    dec('valid', 'Thong tin hop le?', 485, 1170),
    dec('exam', 'Can thi dau vao?', 485, 1325),
    box('examReg', 'Dang ky lich thi va cho dong bo diem', 160, 1475),
    dec('passed', 'Ket qua dat?', 170, 1580),
    box('program', 'Chon chuong trinh hoc', 790, 1475),
    box('docs', 'Dat lich nop ho so goc va sinh ma ho so', 790, 1580),
    err('error', 'Hien thi thong bao loi', 900, 805),
    term('end', 'Ket thuc', 525, 1745),
  ],
  edges: [
    { from: 'start', to: 'login' },
    { from: 'login', to: 'has' },
    { from: 'has', to: 'create', label: 'Khong' },
    { from: 'has', to: 'policy', label: 'Co', fromSide: 'right', toSide: 'right' },
    { from: 'create', to: 'policy' },
    { from: 'policy', to: 'signed' },
    { from: 'signed', to: 'error', label: 'Khong', fromSide: 'right', toSide: 'left' },
    { from: 'signed', to: 'payment', label: 'Co' },
    { from: 'payment', to: 'paid' },
    { from: 'paid', to: 'error', label: 'Khong', fromSide: 'right', toSide: 'left' },
    { from: 'paid', to: 'form', label: 'Co' },
    { from: 'form', to: 'valid' },
    { from: 'valid', to: 'error', label: 'Khong', fromSide: 'right', toSide: 'right' },
    { from: 'valid', to: 'exam', label: 'Co' },
    { from: 'exam', to: 'examReg', label: 'Co', fromSide: 'left', toSide: 'top' },
    { from: 'examReg', to: 'passed' },
    { from: 'passed', to: 'error', label: 'Khong', fromSide: 'right', toSide: 'left' },
    { from: 'passed', to: 'program', label: 'Co', fromSide: 'right', toSide: 'left' },
    { from: 'exam', to: 'program', label: 'Khong', fromSide: 'right', toSide: 'top' },
    { from: 'program', to: 'docs' },
    { from: 'docs', to: 'end', fromSide: 'bottom', toSide: 'right' },
    { from: 'error', to: 'end', fromSide: 'bottom', toSide: 'right' },
  ],
});

draw({
  title: 'Activity Diagram - Phuc khao, phong van, hoa don va thong bao',
  subtitle: 'UC09, UC10 - Theo doi xu ly sau thi va inbox nguoi dung',
  file: '23-recheck-interview-notification-activity.svg',
  width: 1240,
  height: 1260,
  nodes: [
    term('start', 'Bat dau', 545, 105),
    box('login', 'Nguoi dung dang nhap', 495, 185),
    dec('choose', 'Chon chuc nang', 505, 295),
    box('recheck', 'Gui yeu cau phuc khao', 110, 465),
    dec('hasResult', 'Da co ket qua thi?', 120, 570),
    dec('pending', 'Co phuc khao dang xu ly?', 120, 725),
    box('admin', 'Admin xu ly va cap nhat ket qua', 110, 880),
    box('interview', 'Xem lich phong van', 495, 465),
    dec('hasInterview', 'Co lich phong van?', 505, 570),
    box('respond', 'Xac nhan tham gia hoac tu choi', 495, 725),
    box('inbox', 'Xem hoa don va thong bao', 880, 465),
    dec('hasData', 'Co du lieu?', 890, 570),
    box('list', 'Hien thi danh sach va danh dau da doc', 880, 725),
    box('empty', 'Hien thi danh sach rong', 880, 880),
    err('error', 'Hien thi thong bao loi', 495, 1025),
    term('end', 'Ket thuc', 545, 1160),
  ],
  edges: [
    { from: 'start', to: 'login' },
    { from: 'login', to: 'choose' },
    { from: 'choose', to: 'recheck', label: 'Phuc khao', fromSide: 'left', toSide: 'top' },
    { from: 'recheck', to: 'hasResult' },
    { from: 'hasResult', to: 'error', label: 'Khong', fromSide: 'right', toSide: 'left' },
    { from: 'hasResult', to: 'pending', label: 'Co' },
    { from: 'pending', to: 'error', label: 'Co', fromSide: 'right', toSide: 'left' },
    { from: 'pending', to: 'admin', label: 'Khong' },
    { from: 'admin', to: 'end', fromSide: 'bottom', toSide: 'left' },
    { from: 'choose', to: 'interview', label: 'Phong van' },
    { from: 'interview', to: 'hasInterview' },
    { from: 'hasInterview', to: 'error', label: 'Khong' },
    { from: 'hasInterview', to: 'respond', label: 'Co' },
    { from: 'respond', to: 'end' },
    { from: 'choose', to: 'inbox', label: 'Thong bao', fromSide: 'right', toSide: 'top' },
    { from: 'inbox', to: 'hasData' },
    { from: 'hasData', to: 'empty', label: 'Khong', fromSide: 'bottom', toSide: 'top' },
    { from: 'hasData', to: 'list', label: 'Co' },
    { from: 'list', to: 'end', fromSide: 'bottom', toSide: 'right' },
    { from: 'empty', to: 'end', fromSide: 'bottom', toSide: 'right' },
    { from: 'error', to: 'end' },
  ],
});

draw({
  title: 'Activity Diagram - Quan tri he thong',
  subtitle: 'UC11 - UC18 - Dashboard, nguoi dung, ho so, thi diem, noi dung va import export',
  file: '24-admin-management-activity.svg',
  width: 1320,
  height: 1440,
  nodes: [
    term('start', 'Bat dau', 585, 105),
    box('login', 'Admin dang nhap', 535, 185),
    dec('role', 'Co quyen admin?', 545, 295),
    box('dashboard', 'Mo dashboard va tai thong ke', 535, 455),
    dec('module', 'Chon phan he quan ly', 545, 565),
    box('users', 'Quan ly nguoi dung', 80, 760),
    box('enroll', 'Quan ly ho so tuyen sinh', 300, 760),
    box('exam', 'Quan ly thi va diem', 520, 760),
    box('content', 'Quan ly noi dung cau hinh', 740, 760),
    box('csv', 'Import export CSV', 960, 760),
    box('notify', 'Gui thong bao hang loat', 520, 980),
    dec('valid', 'Du lieu thao tac hop le?', 545, 1120),
    box('save', 'Luu thay doi, ghi log va tao thong bao neu can', 535, 1270),
    err('error', 'Hien thi thong bao loi', 900, 1120),
    term('end', 'Ket thuc', 585, 1370),
  ],
  edges: [
    { from: 'start', to: 'login' },
    { from: 'login', to: 'role' },
    { from: 'role', to: 'error', label: 'Khong', fromSide: 'right', toSide: 'top' },
    { from: 'role', to: 'dashboard', label: 'Co' },
    { from: 'dashboard', to: 'module' },
    { from: 'module', to: 'users', fromSide: 'left', toSide: 'top' },
    { from: 'module', to: 'enroll', fromSide: 'left', toSide: 'top' },
    { from: 'module', to: 'exam', toSide: 'top' },
    { from: 'module', to: 'content', fromSide: 'right', toSide: 'top' },
    { from: 'module', to: 'csv', fromSide: 'right', toSide: 'top' },
    { from: 'module', to: 'notify', label: 'Thong bao' },
    { from: 'users', to: 'valid', fromSide: 'bottom', toSide: 'left' },
    { from: 'enroll', to: 'valid', fromSide: 'bottom', toSide: 'left' },
    { from: 'exam', to: 'valid' },
    { from: 'content', to: 'valid', fromSide: 'bottom', toSide: 'right' },
    { from: 'csv', to: 'valid', fromSide: 'bottom', toSide: 'right' },
    { from: 'notify', to: 'valid' },
    { from: 'valid', to: 'error', label: 'Khong', fromSide: 'right', toSide: 'left' },
    { from: 'valid', to: 'save', label: 'Co' },
    { from: 'save', to: 'end' },
    { from: 'error', to: 'end', fromSide: 'bottom', toSide: 'right' },
  ],
});

console.log('Generated activity SVG files in docs/diagrams');
