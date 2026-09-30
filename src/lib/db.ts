export const getInitialData = () => {
  const oldStudents = JSON.parse(localStorage.getItem('students') || '[]');
  if (!localStorage.getItem('students') || (oldStudents.length > 0 && oldStudents.length < 5)) {
    localStorage.setItem('students', JSON.stringify([
      { id: 1, name: 'Nguyễn Tuấn Kiệt', classId: 1, gender: 'Nam', birthday: '2008-05-12', ethnicity: 'Kinh', contactPhone: '0901234567', status: 'Đang học' },
      { id: 2, name: 'Phạm Phương Thảo', classId: 1, gender: 'Nữ', birthday: '2008-11-23', ethnicity: 'Kinh', contactPhone: '0909876543', status: 'Đang học' },
      { id: 3, name: 'Lê Hoàng Phong', classId: 2, gender: 'Nam', birthday: '2008-01-15', ethnicity: 'Kinh', contactPhone: '0912345678', status: 'Đang học' },
      { id: 4, name: 'Trần Vũ Mai Lan', classId: 2, gender: 'Nữ', birthday: '2008-09-02', ethnicity: 'Tày', contactPhone: '0987654321', status: 'Đang học' },
      { id: 5, name: 'Vũ Đức Duy', classId: 1, gender: 'Nam', birthday: '2008-04-18', ethnicity: 'Kinh', contactPhone: '0933112233', status: 'Đang học' },
      { id: 6, name: 'Hoàng Bích Hằng', classId: 1, gender: 'Nữ', birthday: '2008-07-30', ethnicity: 'Kinh', contactPhone: '0944556677', status: 'Đang học' },
      { id: 7, name: 'Đặng Thái Sơn', classId: 2, gender: 'Nam', birthday: '2008-12-05', ethnicity: 'Kinh', contactPhone: '0911223344', status: 'Đang học' },
      { id: 8, name: 'Bùi Thị Thanh Tâm', classId: 2, gender: 'Nữ', birthday: '2008-02-14', ethnicity: 'Mường', contactPhone: '0999888777', status: 'Đã tốt nghiệp' },
      { id: 9, name: 'Lương Thế Vinh', classId: 1, gender: 'Nam', birthday: '2008-06-25', ethnicity: 'Kinh', contactPhone: '0988776655', status: 'Đang học' },
      { id: 10, name: 'Đỗ Quyên Quyên', classId: 2, gender: 'Nữ', birthday: '2008-10-10', ethnicity: 'Kinh', contactPhone: '0977665544', status: 'Đang học' },
      { id: 11, name: 'Phan Đình Tùng', classId: 1, gender: 'Nam', birthday: '2008-03-08', ethnicity: 'Kinh', contactPhone: '0966554433', status: 'Chuyển trường' },
      { id: 12, name: 'Trịnh Khánh Ngọc', classId: 2, gender: 'Nữ', birthday: '2008-08-19', ethnicity: 'Kinh', contactPhone: '0955443322', status: 'Đang học' },
      { id: 13, name: 'Tạ Quang Thắng', classId: 1, gender: 'Nam', birthday: '2008-11-01', ethnicity: 'Kinh', contactPhone: '0944332211', status: 'Đang học' },
      { id: 14, name: 'Ngô Thanh Vân', classId: 2, gender: 'Nữ', birthday: '2008-05-20', ethnicity: 'Kinh', contactPhone: '0933221100', status: 'Đang học' },
      { id: 15, name: 'Dương Khang', classId: 1, gender: 'Nam', birthday: '2008-09-15', ethnicity: 'Kinh', contactPhone: '0922110099', status: 'Đang học' },
      { id: 16, name: 'Đinh Bích Nga', classId: 2, gender: 'Nữ', birthday: '2008-12-25', ethnicity: 'Kinh', contactPhone: '0911009988', status: 'Đang học' },
      { id: 17, name: 'Lý Tiểu Long', classId: 1, gender: 'Nam', birthday: '2008-01-01', ethnicity: 'Hoa', contactPhone: '0900998877', status: 'Đang học' },
      { id: 18, name: 'Đồng Trúc Ly', classId: 2, gender: 'Nữ', birthday: '2008-07-07', ethnicity: 'Kinh', contactPhone: '0899887766', status: 'Đang học' },
      { id: 19, name: 'Khổng Minh', classId: 1, gender: 'Nam', birthday: '2008-04-04', ethnicity: 'Kinh', contactPhone: '0888776655', status: 'Đang học' },
      { id: 20, name: 'Tô Ánh Nguyệt', classId: 2, gender: 'Nữ', birthday: '2008-10-31', ethnicity: 'Kinh', contactPhone: '0877665544', status: 'Đang học' },
    ]));
  }
  
  const oldClasses = JSON.parse(localStorage.getItem('classes') || '[]');
  if (!localStorage.getItem('classes') || (oldClasses.length > 0 && oldClasses[0].schoolYear !== undefined)) {
    localStorage.setItem('classes', JSON.stringify([
      { id: 1, name: '10A1', schoolYearId: 2, teacherId: 2, grade: '10', isActive: 1 },
      { id: 2, name: '10A2', schoolYearId: 2, teacherId: 3, grade: '10', isActive: 1 },
    ]));
  }

  const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
  if (!localStorage.getItem('users') || storedUsers.length === 0) {
    localStorage.setItem('users', JSON.stringify([
      { id: 1, email: 'admin@gmail.com', password: '1212', role: 'Admin', fullName: 'Đào Thuận' },
      { id: 2, email: 'gv01@gmail.com', password: '1212', role: 'Teacher', fullName: 'Trần Thị Mỹ Linh' },
      { id: 3, email: 'gv02@gmail.com', password: '1212', role: 'Teacher', fullName: 'Nguyễn Đình Phong' },
      { id: 4, email: 'gv03@gmail.com', password: '1212', role: 'Teacher', fullName: 'Lê Văn Thắng' },
    ]));
  } else if (storedUsers.some((u: any) => u.password === '123' || u.password === '123456')) {
    const updatedUsers = storedUsers.map((u: any) => {
      if (u.password === '123' || u.password === '123456') {
        return { ...u, password: '1212' };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  }

  const oldAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
  if (!localStorage.getItem('assignments') || (oldAssignments.length > 0 && !oldAssignments[0].dayOfWeek)) {
    localStorage.setItem('assignments', JSON.stringify([
      { id: 1, teacherId: 2, classId: 1, subjectId: 1, dayOfWeek: 'Thứ 2', period: 'Tiết 1 - Tiết 2' },
      { id: 2, teacherId: 3, classId: 2, subjectId: 2, dayOfWeek: 'Thứ 3', period: 'Tiết 3 - Tiết 4' },
      { id: 3, teacherId: 2, classId: 1, subjectId: 2, dayOfWeek: 'Thứ 4', period: 'Tiết 1' },
      { id: 4, teacherId: 4, classId: 2, subjectId: 1, dayOfWeek: 'Thứ 5', period: 'Tiết 4 - Tiết 5' },
    ]));
  }
  if (!localStorage.getItem('schoolYears')) {
    localStorage.setItem('schoolYears', JSON.stringify([
      { id: 1, yearName: '2023-2024', startDate: '2023-09-05', endDate: '2024-05-31', isActive: 0 },
      { id: 2, yearName: '2024-2025', startDate: '2024-09-05', endDate: '2025-05-31', isActive: 1 },
    ]));
  }

  if (!localStorage.getItem('subjects')) {
    localStorage.setItem('subjects', JSON.stringify([
      { id: 1, name: 'Toán học', description: 'Môn Toán cơ bản' },
      { id: 2, name: 'Ngữ văn', description: 'Môn Văn cơ bản' },
      { id: 3, name: 'Tiếng Anh', description: 'Ngoại ngữ' },
    ]));
  }

  if (!localStorage.getItem('semesters')) {
    localStorage.setItem('semesters', JSON.stringify([
      { id: 1, schoolYearId: 2, name: 'Học kỳ 1', startDate: '2024-09-05', endDate: '2025-01-15', isActive: 1 },
      { id: 2, schoolYearId: 2, name: 'Học kỳ 2', startDate: '2025-01-20', endDate: '2025-05-31', isActive: 0 },
    ]));
  }
};

export const getStudents = () => JSON.parse(localStorage.getItem('students') || '[]');
export const getClasses = () => JSON.parse(localStorage.getItem('classes') || '[]');
export const getUsers = () => JSON.parse(localStorage.getItem('users') || '[]');
export const getSchoolYears = () => JSON.parse(localStorage.getItem('schoolYears') || '[]');
export const getSubjects = () => JSON.parse(localStorage.getItem('subjects') || '[]');
export const getSemesters = () => JSON.parse(localStorage.getItem('semesters') || '[]');
export const getAssignments = () => JSON.parse(localStorage.getItem('assignments') || '[]');

export const saveStudents = (data: any) => localStorage.setItem('students', JSON.stringify(data));
export const saveClasses = (data: any) => localStorage.setItem('classes', JSON.stringify(data));
export const saveAssignments = (data: any) => localStorage.setItem('assignments', JSON.stringify(data));

// Initialize on load
getInitialData();
