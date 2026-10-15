// Service kết nối Groq API cho Hệ thống Everest School
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('VITE_GROQ_API_KEY') || '' : '');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'qwen/qwen3.8-27b';
const FALLBACK_MODEL = 'openai/gpt-oss-120b';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callGroqChat(messages: ChatMessage[], temperature: number = 0.5): Promise<string> {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages,
        temperature,
      }),
    });

    if (!res.ok) {
      console.warn('Primary model failed, attempting fallback...');
      const fallbackRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: FALLBACK_MODEL,
          messages,
          temperature,
        }),
      });

      if (!fallbackRes.ok) {
        throw new Error(`Groq API Error: ${fallbackRes.statusText}`);
      }

      const fallbackData = await fallbackRes.json();
      return fallbackData.choices?.[0]?.message?.content || 'Không có phản hồi từ AI.';
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Không có phản hồi từ AI.';
  } catch (err: any) {
    console.error('AI Service Error:', err);
    throw err;
  }
}

// 1. AI Phân tích & Viết Báo cáo Tổng quan cho Dashboard
export async function generateDashboardReport(data: {
  studentsCount: number;
  classesCount: number;
  teachersCount: number;
  activeSchoolYear: string;
  males: number;
  females: number;
  statusStats: { [key: string]: number };
  classesStats: { name: string; count: number }[];
}): Promise<string> {
  const prompt = `
Bạn là Chuyên gia Cố vấn Quản lý Giáo dục cao cấp của trường liên cấp "Everest School".
Dưới đây là dữ liệu thống kê thực tế hiện tại của trường trong năm học ${data.activeSchoolYear}:
- Tổng số học sinh: ${data.studentsCount} học sinh (${data.males} Nam, ${data.females} Nữ)
- Tổng số giáo viên: ${data.teachersCount} giáo viên
- Tổng số lớp học đang hoạt động: ${data.classesCount} lớp
- Tỷ lệ trạng thái học sinh: ${JSON.stringify(data.statusStats)}
- Sĩ số chi tiết từng lớp: ${data.classesStats.map(c => `${c.name}: ${c.count} học sinh`).join(', ')}
- Tỷ lệ học sinh/giáo viên: ${(data.studentsCount / (data.teachersCount || 1)).toFixed(1)} học sinh/giáo viên.

Hãy lập một bản "Báo Cáo Nhận Định & Đánh Giá Tổng Quan Học Đường" súc tích, chuyên nghiệp dành riêng cho Ban Giám Hiệu gồm 3 phần:
## 1. 📌 TÌNH HÌNH QUY MÔ & PHÂN BỔ HỌC SINH
## 2. ⚖️ ĐÁNH GIÁ NĂNG LỰC GIÁO DỤC & ĐỘ ỔN ĐỊNH
## 3. 💡 KHUYẾN NGHỊ TRỌNG TÂM CHO BAN GIÁM HIỆU

QUY TẮC ĐỊNH DẠNG BẮT BUỘC:
- Dùng gạch đầu dòng (*) cho mỗi luận điểm.
- Ở đầu MỖI gạch đầu dòng, BẮT BUỘC in đậm cụm từ khóa/tiêu đề ý chính (Ví dụ: * **Cơ cấu giới tính cân đối:** Chi tiết phân tích... ; * **Phân bố sĩ số các khối:** Chi tiết phân tích...).
- Văn phong sư phạm sang trọng, phân tích sắc bén, câu cú mạch lạc.
`;

  return callGroqChat([
    { role: 'system', content: 'Bạn là chuyên gia phân tích dữ liệu giáo dục và cố vấn quản lý trường học Everest School.' },
    { role: 'user', content: prompt }
  ], 0.4);
}

// 2. AI Rà soát & Tối ưu Phân công Giảng dạy
export async function auditTeachingAssignments(data: {
  assignments: any[];
  teachers: any[];
  classes: any[];
  subjects: any[];
}): Promise<string> {
  const prompt = `
Bạn là Cố vấn Đào tạo & Xếp Thời khóa biểu chuyên nghiệp tại Everest School.
Dưới đây là dữ liệu phân công giảng dạy hiện tại của nhà trường:
- Danh sách giáo viên (${data.teachers.length} người): ${data.teachers.map(t => `${t.fullName} (ID: ${t.id})`).join(', ')}
- Danh sách lớp (${data.classes.length} lớp): ${data.classes.map(c => c.name).join(', ')}
- Danh mục môn học (${data.subjects.length} môn): ${data.subjects.map(s => s.name).join(', ')}
- Dữ liệu các tiết phân công hiện tại (${data.assignments.length} tiết):
${data.assignments.map(a => {
  const t = data.teachers.find(u => u.id === a.teacherId)?.fullName || 'Chưa gán GV';
  const c = data.classes.find(cl => cl.id === a.classId)?.name || 'Lớp không rõ';
  const s = data.subjects.find(sb => sb.id === a.subjectId)?.name || 'Môn không rõ';
  return `- Giáo viên: ${t} | Lớp: ${c} | Môn: ${s} | ${a.dayOfWeek || 'Chưa xếp thứ'} | ${a.period || 'Chưa xếp tiết'}`;
}).join('\n')}

Hãy thực hiện rà soát chuyên sâu và đưa ra báo cáo "Đánh Giá & Tối Ưu Phân Công Giảng Dạy" gồm các phần:
## 1. ⚠️ PHÁT HIỆN XUNG ĐỘT & LỖI LỊCH DẠY
## 2. 📊 CÂN ĐỐI TẢI CÔNG VIỆC GIÁO VIÊN
## 3. 🏫 ĐỘ PHỦ MÔN HỌC THEO LỚP
## 4. 💡 ĐỀ XUẤT ĐIỀU PHỐI TỐI ƯU

QUY TẮC ĐỊNH DẠNG BẮT BUỘC:
- Dùng gạch đầu dòng (*) cho mỗi ý.
- BẮT BUỘC in đậm cụm từ khóa mở đầu (Ví dụ: * **Phát hiện trùng tiết:** ... ; * **Giáo viên quá tải:** ...).
- Ngôn ngữ chuẩn xác, dễ theo dõi.
`;

  return callGroqChat([
    { role: 'system', content: 'Bạn là chuyên gia thẩm định và điều phối thời khóa biểu trường học.' },
    { role: 'user', content: prompt }
  ], 0.3);
}

// 3. AI Nhận xét & Cảnh báo sớm học sinh
export async function generateStudentEvaluation(student: {
  name: string;
  gender: string;
  birthday: string;
  ethnicity: string;
  gpa: number;
  className: string;
  status: string;
  positiveTraits?: string[];
  limitationTraits?: string[];
}): Promise<string> {
  const age = new Date().getFullYear() - new Date(student.birthday).getFullYear();
  const gpaCategory = student.gpa >= 8.0 ? 'Xuất sắc' : student.gpa >= 6.5 ? 'Khá' : student.gpa >= 5.0 ? 'Trung bình' : 'Yếu / Cần chú ý đặc biệt';

  const positiveLine = (student.positiveTraits && student.positiveTraits.length > 0)
    ? `- Điểm tích cực giáo viên ghi nhận: ${student.positiveTraits.join(', ')}.`
    : '';
  const limitationLine = (student.limitationTraits && student.limitationTraits.length > 0)
    ? `- Hạn chế cần cải thiện: ${student.limitationTraits.join(', ')}.`
    : '';
  const traitBlock = [positiveLine, limitationLine].filter(Boolean).join('\n');

  const prompt = `
Bạn là Giáo viên Chủ nhiệm chuyên nghiệp tại trường Everest School. Hãy viết nhận xét học bạ cuối kỳ cho học sinh sau:

THÔNG TIN HỌC SINH:
- Họ và tên: ${student.name}
- Giới tính: ${student.gender}
- Tuổi: ${age} tuổi
- Dân tộc: ${student.ethnicity}
- Lớp: ${student.className}
- Điểm trung bình (GPA): ${student.gpa.toFixed(1)} / 10 → Xếp loại học lực: **${gpaCategory}**
${traitBlock}

NHIỆM VỤ: Hãy viết ĐÚNG 3 phần nhận xét sau (ngắn gọn, súc tích, mỗi phần 2-3 câu). Hãy LỒNG GHÉP cụ thể các điểm tích cực và hạn chế đã nêu vào nội dung nhận xét:

**📚 Kết quả học tập:**
[Nhận xét về điểm trung bình ${student.gpa.toFixed(1)}, xếp loại ${gpaCategory}. Nếu có điểm tích cực thì nhấn mạnh vào chúng.]

**🌱 Rèn luyện & Đạo đức:**
[Nhận xét về thái độ học tập, kỷ luật, đạo đức. Nếu có hạn chế được chọn thì nhận xét đúng thực tế nhưng khéo léo, xây dựng.]

**💡 Định hướng & Khuyến nghị:**
[Lời khuyên cụ thể, thiết thực giúp học sinh cải thiện hoặc phát huy. Hướng đến các hạn chế đã nêu nếu có.]

QUY TẮC ĐỊNH DẠNG:
- Giữ đúng các tiêu đề in đậm như mẫu trên.
- Văn phong sư phạm, nhân văn, ấm áp, truyền động lực.
- Đề cập đích danh tên học sinh "${student.name}" ít nhất 1 lần.
- Không sử dụng ký tự đặc biệt thừa, giữ câu văn thuần Việt, trong sáng.
`;

  return callGroqChat([
    { role: 'system', content: 'Bạn là giáo viên chủ nhiệm dày dạn kinh nghiệm tại trường Everest School, chuyên viết nhận xét học bạ chuyên nghiệp.' },
    { role: 'user', content: prompt }
  ], 0.5);
}

// 4. Everest AI Assistant Chatbot Context Generator
export function getSystemKnowledgeContext(): string {
  try {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const maleCount = students.filter((s: any) => s.gender === 'Nam').length;
    const femaleCount = students.filter((s: any) => s.gender === 'Nữ').length;

    const classSummaries = classes.map((c: any) => {
      const classStudents = students.filter((s: any) => Number(s.classId) === Number(c.id));
      const homeroomTeacher = users.find((u: any) => Number(u.id) === Number(c.teacherId))?.fullName || 'Chưa gán';
      return `Lớp ${c.name}: Sĩ số ${classStudents.length} học sinh, GVCN: ${homeroomTeacher}, Khối: ${c.grade}`;
    }).join('; ');

    const teacherList = users.filter((u: any) => u.role === 'Teacher' || u.role === 'Admin').map((u: any) => `${u.fullName} (${u.role})`).join(', ');

    return `
Bạn là "Everest AI Assistant" - Trợ lý trí tuệ nhân tạo chuyên trách của hệ thống "Sổ Theo Dõi Học Tập Học Sinh - Trường Everest School".
Bạn đang phục vụ người dùng: ${currentUser?.fullName || 'Người dùng'} (Vai trò: ${currentUser?.role || 'Khách'}).

DỮ LIỆU THỰC TẾ TRONG HỆ THỐNG TRƯỜNG EVEREST SCHOOL HIỆN TẠI:
- Tổng số học sinh: ${students.length} em (${maleCount} Nam, ${femaleCount} Nữ).
- Danh sách lớp học và GVCN: ${classSummaries}.
- Danh sách giáo viên / cán bộ: ${teacherList}.
- Danh sách môn học: ${subjects.map((s: any) => s.name).join(', ')}.
- Tổng số tiết phân công giảng dạy: ${assignments.length} tiết.
- Danh sách học sinh tiêu biểu: ${students.slice(0, 10).map((s: any) => `${s.name} (${s.gender}, Lớp ID ${s.classId}, SĐT: ${s.contactPhone}, TT: ${s.status})`).join('; ')}...

NHIỆM VỤ VÀ PHONG CÁCH CỦA BẠN:
1. Luôn trả lời bằng tiếng Việt thân thiện, lễ phép, chuẩn mực ngôn ngữ sư phạm của trường học.
2. Khi người dùng hỏi về số liệu trường (sĩ số, số giáo viên, học sinh nam/nữ, tên giáo viên chủ nhiệm...), hãy dùng CHÍNH XÁC dữ liệu thực tế ở trên để trả lời.
3. Khi người dùng nhờ soạn thảo (tin nhắn gửi phụ huynh, nhận xét học sinh, biên bản họp lớp, kế hoạch tuần...), hãy soạn thảo đầy đủ, chu đáo, có tên trường Everest School.
4. Trả lời ngắn gọn, súc tích, có định dạng danh sách dễ đọc.
`;
  } catch (e) {
    return 'Bạn là trợ lý AI của Everest School.';
  }
}
