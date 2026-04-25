// full screen
document.addEventListener("DOMContentLoaded", function () {
    const fc_btn = document.getElementById('fullscreen_btn');
    const fc_target = document.getElementById('output');

    fc_btn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            fc_target.requestFullscreen();
        }
        else {
            document.exitFullscreen();
        }
    });
});

// Course Manager Class
class CourseManager {
    constructor(gradeType, className) {
        this.gradeType = gradeType;
        this.className = className;
        this.courses = [];
        this.counterInterval = null;
    }

    addCourse(course) {
        this.courses.push(course);
    }

    updateCourse(index, updatedCourse) {
        this.courses[index] = updatedCourse;
    }

    deleteCourse(index) {
        this.courses.splice(index, 1);
    }

    clearAllCourses() {
        this.courses = [];
    }
}

// Initialize two course managers
let courseManagerPrimary = null;
let courseManagerSecondary = null;
let editingType = null;
let editingIndex = null;
let isManualInput = false; // Track if we're in manual input mode

// Grade type selection
$('#select_grade_type').change(function () {
    const gradeType = $(this).val();

    if (gradeType === 'none') {
        $('#select_class_1').html('<option value="none">-選擇班級-</option>');
        $('#select_class_2').html('<option value="none">-選擇班級-</option>');
        document.getElementById('schedule').innerHTML = '';
        isManualInput = false;
        return;
    }

    // Update class selection options
    updateClassOptions(gradeType);
});

function updateClassOptions(gradeType) {
    const options = gradeType === 'junior'
        ? [
            { value: 'j1', text: '國一' },
            { value: 'j2', text: '國二' },
            { value: 'j3', text: '國三' }
        ]
        : [
            { value: 's1_science', text: '高一[自]' },
            { value: 's1_social', text: '高一[社]' },
            { value: 's2_science', text: '高二[自]' },
            { value: 's2_social', text: '高二[社]' },
            { value: 's3_science', text: '高三[自]' },
            { value: 's3_social', text: '高三[社]' }
        ];

    let html = '<option value="none">-選擇班級-</option>';
    options.forEach(option => {
        html += `<option value="${option.value}">${option.text}</option>`;
    });

    $('#select_class_1').html(html);
    $('#select_class_2').html(html);
}

// Class 1 selection
$('#select_class_1').change(function () {
    const classValue = $(this).val();
    const gradeType = $('#select_grade_type').val();

    if (classValue === 'none') {
        courseManagerPrimary = null;
        renderCombinedSchedule();
        return;
    }

    loadClassData(classValue, gradeType, 'primary');
});

// Class 2 selection
$('#select_class_2').change(function () {
    const classValue = $(this).val();
    const gradeType = $('#select_grade_type').val();

    if (classValue === 'none') {
        courseManagerSecondary = null;
        renderCombinedSchedule();
        return;
    }

    loadClassData(classValue, gradeType, 'secondary');
});

function loadClassData(classValue, gradeType, managerType) {
    fetch('/grade_select', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grade: classValue })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);

            if (managerType === 'primary') {
                courseManagerPrimary = new CourseManager('primary', classValue);
                isManualInput = false; // Reset to CSV mode
            } else {
                courseManagerSecondary = new CourseManager('secondary', classValue);
            }

            const manager = managerType === 'primary' ? courseManagerPrimary : courseManagerSecondary;

            data.forEach(row => {
                const course = {
                    start_time: row.start_time,
                    end_time: row.end_time,
                    subject: row.subject,
                    subject2: '',
                    change_class: row.change_class_no === '原'
                };

                manager.addCourse(course);
            });

            renderCombinedSchedule();
            startGlobalCounter();
        })
        .catch(err => {
            console.error('Error loading class data:', err);
            alert('無法加載班級資料，請檢查網絡連接');
        });
}

// Render combined schedule with both classes
function renderCombinedSchedule() {
    const container = document.getElementById('schedule');
    if (!container) return;

    container.innerHTML = "";

    if (!courseManagerPrimary) return;

    const primaryCourses = courseManagerPrimary.courses;
    const secondaryCourses = courseManagerSecondary ? courseManagerSecondary.courses : [];

    // Get all unique times from both managers
    const allTimes = new Set();
    primaryCourses.forEach(course => {
        allTimes.add(course.start_time + '-' + course.end_time);
    });
    secondaryCourses.forEach(course => {
        allTimes.add(course.start_time + '-' + course.end_time);
    });

    // Sort times
    const sortedTimes = Array.from(allTimes).sort();

    sortedTimes.forEach(timeSlot => {
        const [startTime, endTime] = timeSlot.split('-');

        // Find course in primary
        const primaryCourse = primaryCourses.find(c => c.start_time === startTime && c.end_time === endTime);

        // Find course in secondary
        const secondaryCourse = secondaryCourses.find(c => c.start_time === startTime && c.end_time === endTime);

        let courseText = `${startTime} ~ ${endTime} `;

        if (primaryCourse) {
            courseText += primaryCourse.subject;

            // 添加轉班標記「(原)」
            if (primaryCourse.change_class) {
                courseText += "(原)";
            }

            // 添加第二科目（只有當沒有轉班標記時才顯示班級2）
            if (!primaryCourse.change_class) {
                if (primaryCourse.subject2 && primaryCourse.subject2.trim()) {
                    courseText += " / " + primaryCourse.subject2;
                }
                // 如果班級1沒有第二科目，才顯示班級2的資料
                if (!primaryCourse.subject2 && secondaryCourse) {
                    courseText += " / " + secondaryCourse.subject;
                    if (secondaryCourse.change_class) {
                        courseText += "(原)";
                    }
                    if (secondaryCourse.subject2 && secondaryCourse.subject2.trim()) {
                        courseText += " / " + secondaryCourse.subject2;
                    }
                }
            }
        } else if (secondaryCourse) {
            // 如果班級1沒有課程，只顯示班級2的
            courseText += secondaryCourse.subject;
            if (secondaryCourse.change_class) {
                courseText += "(原)";
            }
            if (secondaryCourse.subject2 && secondaryCourse.subject2.trim()) {
                courseText += " / " + secondaryCourse.subject2;
            }
        }

        // 創建一個 span 來包裝每一行課程
        const courseSpan = document.createElement('span');
        courseSpan.className = 'course-item';
        courseSpan.dataset.time = timeSlot;
        courseSpan.textContent = courseText;
        courseSpan.style.cursor = 'pointer';
        courseSpan.style.display = 'block';
        courseSpan.style.margin = '3px 0';
        courseSpan.style.padding = '5px';
        courseSpan.style.transition = 'all 0.3s ease';

        courseSpan.addEventListener('click', () => {
            if (primaryCourse) {
                openEditModal('primary', primaryCourses.indexOf(primaryCourse), primaryCourse);
            }
        });

        container.appendChild(courseSpan);

        // 添加換行
        const br = document.createElement('br');
        container.appendChild(br);
    });

    updateVisualState();
    startGlobalCounter();
}

function updateVisualState() {
    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const nowTimeInMinutes = nowHours * 60 + nowMinutes;

    const container = document.getElementById('schedule');
    if (!container) return;

    const courseItems = container.querySelectorAll('.course-item');

    courseItems.forEach((item) => {
        const timeSlot = item.dataset.time;
        const [startTime, endTime] = timeSlot.split('-');
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);

        const startTimeInMinutes = startHours * 60 + startMinutes;
        const endTimeInMinutes = endHours * 60 + endMinutes;

        // 移除之前的樣式
        item.classList.remove('course-current');
        item.style.textDecoration = 'none';
        item.style.color = '#000';
        item.style.border = 'none';
        item.style.backgroundColor = 'transparent';

        if (nowTimeInMinutes >= startTimeInMinutes && nowTimeInMinutes < endTimeInMinutes) {
            // 進行中 - 白色背景 + 邊框
            item.classList.add('course-current');
            item.style.backgroundColor = '#ffffff';
            item.style.border = '2px solid #4CAF50';
        } else if (nowTimeInMinutes >= endTimeInMinutes) {
            // 已結束 - 加刪除線
            item.style.textDecoration = 'line-through';
            item.style.color = '#999';
        }
    });
}

// Manual course input
function open_input() {
    const input_show = document.getElementById("add");

    // 如果要進入手動輸入模式，清除所有現有資料
    if (input_show.style.display == "none") {
        isManualInput = true;
        courseManagerPrimary = new CourseManager('primary', 'manual');
        courseManagerSecondary = null;
        document.getElementById('schedule').innerHTML = '';

        // 清空班級選取框
        $('#select_grade_type').val('none');
        $('#select_class_1').html('<option value="none">-選擇班級-</option>');
        $('#select_class_2').html('<option value="none">-選擇班級-</option>');

        input_show.style.display = "block";
    } else {
        input_show.style.display = "none";
    }

    const open_button = document.getElementById("add_subject");
    if (open_button.innerText == "add subject") {
        open_button.innerText = "Close";
    } else {
        open_button.innerText = "add subject";
    }
}

function add_course_manually() {
    const subject = document.getElementById("subject").value;
    const subject2 = document.getElementById("subject2").value;
    const start_time = document.getElementById("start_time").value;
    const end_time = document.getElementById("end_time").value;
    const change_class = document.getElementById("change_class_yes").checked;

    if (subject == '') {
        alert('請輸入科目');
        return;
    }

    if (start_time == '') {
        alert('請輸入開始時間');
        return;
    }

    if (end_time == '') {
        alert('請輸入結束時間');
        return;
    }

    const course = {
        start_time: start_time,
        subject: subject,
        subject2: subject2,
        end_time: end_time,
        change_class: change_class
    };

    // Add to primary manager if it exists
    if (courseManagerPrimary) {
        courseManagerPrimary.addCourse(course);
    } else {
        alert('請先選擇班級或點擊「add subject」');
        return;
    }

    // Clear input
    document.getElementById("subject").value = '';
    document.getElementById("subject2").value = '';
    document.getElementById("start_time").value = '';
    document.getElementById("end_time").value = '';
    document.getElementById("change_class_yes").checked = false;
    document.getElementById("change_class_no").checked = false;

    renderCombinedSchedule();
    startGlobalCounter();
}

// Edit modal
function openEditModal(type, index, course) {
    editingType = type;
    editingIndex = index;

    document.getElementById("edit_subject").value = course.subject;
    document.getElementById("edit_subject2").value = course.subject2 || '';
    document.getElementById("edit_start_time").value = course.start_time;
    document.getElementById("edit_end_time").value = course.end_time;
    document.getElementById("edit_change_class_yes").checked = course.change_class || false;
    document.getElementById("edit_change_class_no").checked = !course.change_class;

    const modal = document.getElementById("editModal");
    modal.style.display = "block";
}

function closeEditModal() {
    const modal = document.getElementById("editModal");
    modal.style.display = "none";
    editingType = null;
    editingIndex = null;
}

function saveEditCourse() {
    const subject = document.getElementById("edit_subject").value;
    const subject2 = document.getElementById("edit_subject2").value;
    const start_time = document.getElementById("edit_start_time").value;
    const end_time = document.getElementById("edit_end_time").value;
    const change_class = document.getElementById("edit_change_class_yes").checked;

    if (subject == '') {
        alert('請輸入科目');
        return;
    }

    if (start_time == '') {
        alert('請輸入開始時間');
        return;
    }

    if (end_time == '') {
        alert('請輸入結束時間');
        return;
    }

    const updatedCourse = {
        start_time: start_time,
        subject: subject,
        subject2: subject2,
        end_time: end_time,
        change_class: change_class
    };

    if (editingType === 'primary' && courseManagerPrimary) {
        courseManagerPrimary.updateCourse(editingIndex, updatedCourse);
    } else if (editingType === 'secondary' && courseManagerSecondary) {
        courseManagerSecondary.updateCourse(editingIndex, updatedCourse);
    }

    closeEditModal();
    renderCombinedSchedule();
    startGlobalCounter();
}

function deleteEditCourse() {
    if (confirm('確定要刪除此科目嗎？')) {
        if (editingType === 'primary' && courseManagerPrimary) {
            courseManagerPrimary.deleteCourse(editingIndex);
        } else if (editingType === 'secondary' && courseManagerSecondary) {
            courseManagerSecondary.deleteCourse(editingIndex);
        }
        closeEditModal();
        renderCombinedSchedule();
        startGlobalCounter();
    }
}

// Close modal when clicking outside
window.addEventListener('click', function (event) {
    const modal = document.getElementById("editModal");
    if (event.target == modal) {
        closeEditModal();
    }
});

// Change class checkbox logic
document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('change_class')) {
            const yes = document.getElementById("change_class_yes");
            const no = document.getElementById("change_class_no");

            if (e.target.id === "change_class_yes" && yes.checked) {
                no.checked = false;
            }

            if (e.target.id === "change_class_no" && no.checked) {
                yes.checked = false;
            }
        }

        if (e.target.classList.contains('edit_change_class')) {
            const yes = document.getElementById("edit_change_class_yes");
            const no = document.getElementById("edit_change_class_no");

            if (e.target.id === "edit_change_class_yes" && yes.checked) {
                no.checked = false;
            }

            if (e.target.id === "edit_change_class_no" && no.checked) {
                yes.checked = false;
            }
        }
    });
});

// Global counter for displaying current course
function startGlobalCounter() {
    setInterval(updateGlobalCounter, 1000);
    updateGlobalCounter();
}

function updateGlobalCounter() {
    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const nowTimeInMinutes = nowHours * 60 + nowMinutes;

    let foundCurrent = false;
    let foundNext = false;

    // Check in both managers
    const managers = [
        { manager: courseManagerPrimary, label: '主' },
        { manager: courseManagerSecondary, label: '副' }
    ];

    managers.forEach(({ manager, label }) => {
        if (!manager || foundCurrent) return;

        manager.courses.forEach((course, index) => {
            const [startHours, startMinutes] = course.start_time.split(":").map(Number);
            const [endHours, endMinutes] = course.end_time.split(":").map(Number);

            const startTimeInMinutes = startHours * 60 + startMinutes;
            const endTimeInMinutes = endHours * 60 + endMinutes;

            if (nowTimeInMinutes >= startTimeInMinutes && nowTimeInMinutes < endTimeInMinutes && !foundCurrent) {
                foundCurrent = true;
                let courseText = course.subject;

                // 添加轉班標記「(原)」
                if (course.change_class) {
                    courseText += "(原)";
                }

                // 添加第二科目
                if (course.subject2 && course.subject2.trim()) {
                    courseText += " / " + course.subject2;
                }

                document.getElementById("arrive_subject").innerHTML = courseText;

                const leftMinutes = endTimeInMinutes - nowTimeInMinutes;
                document.getElementById("count_down").innerHTML = leftMinutes + " min";
                return;
            }
        });
    });

    if (!foundCurrent) {
        // Find next course
        let nextCourse = null;
        let minWaitTime = Infinity;

        managers.forEach(({ manager, label }) => {
            if (!manager) return;

            manager.courses.forEach((course, index) => {
                const [startHours, startMinutes] = course.start_time.split(":").map(Number);
                const startTimeInMinutes = startHours * 60 + startMinutes;

                if (startTimeInMinutes > nowTimeInMinutes && startTimeInMinutes - nowTimeInMinutes < minWaitTime) {
                    minWaitTime = startTimeInMinutes - nowTimeInMinutes;
                    nextCourse = course;
                }
            });
        });

        if (nextCourse) {
            foundNext = true;
            let courseText = "下節 " + nextCourse.subject;

            // 添加轉班標記「(原)」
            if (nextCourse.change_class) {
                courseText += "(原)";
            }

            // 添加第二科目
            if (nextCourse.subject2 && nextCourse.subject2.trim()) {
                courseText += " / " + nextCourse.subject2;
            }

            document.getElementById("arrive_subject").innerHTML = courseText;
            document.getElementById("count_down").innerHTML = "還有 " + minWaitTime + " min";
        } else {
            document.getElementById("arrive_subject").innerHTML = "全部結束";
            document.getElementById("count_down").innerHTML = " ";
        }
    }
}

// Image upload for seat
const fileInput = document.getElementById('fileInput');
const previewImg = document.getElementById('preview');
const delete_button = document.getElementById('seat_delete');

let uploadedImageData = null;

fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            uploadedImageData = e.target.result;
            previewImg.src = uploadedImageData;
        };

        if (delete_button.style.display === "none") {
            delete_button.style.display = "block";
        } else {
            delete_button.style.display = "none";
        }

        reader.readAsDataURL(file);
    }
});

function delete_photo() {
    previewImg.src = '';
    fileInput.value = '';

    if (delete_button.style.display === "none") {
        delete_button.style.display = "block";
    } else {
        delete_button.style.display = "none";
    }
}

// Current time display
function currentTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    if (seconds < 10) seconds = '0' + seconds;

    document.getElementById("current_time").innerHTML = hours + "：" + minutes + "：" + seconds;
}

setInterval(currentTime, 1000);