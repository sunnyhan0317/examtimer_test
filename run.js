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
    constructor(gradeKey) {
        this.gradeKey = gradeKey;
        this.courses = [];
        this.counterInterval = null;
    }

    addCourse(course) {
        this.courses.push(course);
        this.renderSchedule();
    }

    updateCourse(index, updatedCourse) {
        this.courses[index] = updatedCourse;
        this.renderSchedule();
    }

    deleteCourse(index) {
        this.courses.splice(index, 1);
        this.renderSchedule();
    }

    clearAllCourses() {
        this.courses = [];
        this.renderSchedule();
    }

    renderSchedule() {
        const container = document.getElementById(`schedule_${this.gradeKey}`);
        if (!container) return;
        
        container.innerHTML = "";

        this.courses.forEach((course, index) => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';
            courseElement.dataset.index = index;
            courseElement.dataset.grade = this.gradeKey;

            let courseText = `${course.start_time} ~ ${course.end_time} `;
            if (course.subject2 && course.subject2.trim()) {
                courseText += `${course.subject} / ${course.subject2}`;
            } else {
                courseText += course.subject;
            }

            if (course.change_class) {
                courseText += "(原)";
            }

            courseElement.textContent = courseText;
            courseElement.style.cursor = 'pointer';
            
            courseElement.addEventListener('click', () => {
                openEditModal(this.gradeKey, index, course);
            });

            container.appendChild(courseElement);
        });

        this.startCounter();
    }

    startCounter() {
        if (this.counterInterval) clearInterval(this.counterInterval);
        this.counterInterval = setInterval(() => this.updateVisualState(), 1000);
        this.updateVisualState();
    }

    updateVisualState() {
        const now = new Date();
        const nowHours = now.getHours();
        const nowMinutes = now.getMinutes();
        const nowTimeInMinutes = nowHours * 60 + nowMinutes;

        const container = document.getElementById(`schedule_${this.gradeKey}`);
        if (!container) return;

        const courseItems = container.querySelectorAll('.course-item');

        courseItems.forEach((item, index) => {
            const course = this.courses[index];
            const [startHours, startMinutes] = course.start_time.split(":").map(Number);
            const [endHours, endMinutes] = course.end_time.split(":").map(Number);

            const startTimeInMinutes = startHours * 60 + startMinutes;
            const endTimeInMinutes = endHours * 60 + endMinutes;

            // 移除之前的樣式
            item.classList.remove('course-current', 'course-completed');
            item.style.textDecoration = 'none';

            if (nowTimeInMinutes >= startTimeInMinutes && nowTimeInMinutes < endTimeInMinutes) {
                // 進行中
                item.classList.add('course-current');
            } else if (nowTimeInMinutes >= endTimeInMinutes) {
                // 已結束 - 加刪除線
                item.style.textDecoration = 'line-through';
                item.style.color = '#999';
            }
        });
    }
}

// Initialize two course managers
let courseManagerJ = null;
let courseManagerS = null;
let editingGradeKey = null;
let editingIndex = null;

// Grade selection handlers
$('#select_grade_j').change(function () {
    const grade = $(this).val();
    
    if (grade === 'none_j') {
        if (courseManagerJ) {
            courseManagerJ.clearAllCourses();
            courseManagerJ = null;
        }
        document.getElementById('schedule_j_container').style.display = 'none';
        return;
    }

    loadGradeData(grade, 'j');
});

$('#select_grade_s').change(function () {
    const grade = $(this).val();
    
    if (grade === 'none_s') {
        if (courseManagerS) {
            courseManagerS.clearAllCourses();
            courseManagerS = null;
        }
        document.getElementById('schedule_s_container').style.display = 'none';
        return;
    }

    loadGradeData(grade, 's');
});

function loadGradeData(grade, gradeType) {
    fetch('/grade_select', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grade: grade })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);

            if (gradeType === 'j') {
                courseManagerJ = new CourseManager('j');
                document.getElementById('schedule_j_container').style.display = 'block';
                document.getElementById('schedule_j_label').textContent = grade.toUpperCase();
            } else {
                courseManagerS = new CourseManager('s');
                document.getElementById('schedule_s_container').style.display = 'block';
                document.getElementById('schedule_s_label').textContent = grade.toUpperCase();
            }

            data.forEach(row => {
                const course = {
                    start_time: row.start_time,
                    end_time: row.end_time,
                    subject: row.subject,
                    subject2: row.change_class_no || '',
                    change_class: false
                };
                
                if (gradeType === 'j') {
                    courseManagerJ.addCourse(course);
                } else {
                    courseManagerS.addCourse(course);
                }
            });

            startGlobalCounter();
        })
        .catch(err => {
            console.error('Error loading grade data:', err);
            alert('無法加載年級資料，請檢查網絡連接');
        });
}

// Manual course input
function open_input() {
    const input_show = document.getElementById("add");
    if (input_show.style.display == "none") {
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

    // Add to both managers if they exist, otherwise create a temporary one
    if (!courseManagerJ && !courseManagerS) {
        courseManagerJ = new CourseManager('j');
        document.getElementById('schedule_j_container').style.display = 'block';
        document.getElementById('schedule_j_label').textContent = '自訂';
    }

    if (courseManagerJ) {
        courseManagerJ.addCourse(course);
    }

    // Clear input
    document.getElementById("subject").value = '';
    document.getElementById("subject2").value = '';
    document.getElementById("start_time").value = '';
    document.getElementById("end_time").value = '';
    document.getElementById("change_class_yes").checked = false;
    document.getElementById("change_class_no").checked = false;

    startGlobalCounter();
}

// Edit modal
function openEditModal(gradeKey, index, course) {
    editingGradeKey = gradeKey;
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
    editingGradeKey = null;
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

    if (editingGradeKey === 'j' && courseManagerJ) {
        courseManagerJ.updateCourse(editingIndex, updatedCourse);
    } else if (editingGradeKey === 's' && courseManagerS) {
        courseManagerS.updateCourse(editingIndex, updatedCourse);
    }

    closeEditModal();
    startGlobalCounter();
}

function deleteEditCourse() {
    if (confirm('確定要刪除此科目嗎？')) {
        if (editingGradeKey === 'j' && courseManagerJ) {
            courseManagerJ.deleteCourse(editingIndex);
        } else if (editingGradeKey === 's' && courseManagerS) {
            courseManagerS.deleteCourse(editingIndex);
        }
        closeEditModal();
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
        { manager: courseManagerJ, label: '國中' },
        { manager: courseManagerS, label: '高中' }
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
        managers.forEach(({ manager, label }) => {
            if (!manager || foundNext) return;

            let nextIndex = -1;
            let minWaitTime = Infinity;

            manager.courses.forEach((course, index) => {
                const [startHours, startMinutes] = course.start_time.split(":").map(Number);
                const startTimeInMinutes = startHours * 60 + startMinutes;

                if (startTimeInMinutes > nowTimeInMinutes && startTimeInMinutes - nowTimeInMinutes < minWaitTime) {
                    minWaitTime = startTimeInMinutes - nowTimeInMinutes;
                    nextIndex = index;
                }
            });

            if (nextIndex !== -1) {
                foundNext = true;
                const nextCourse = manager.courses[nextIndex];
                let courseText = "下節 " + nextCourse.subject;
                if (nextCourse.subject2 && nextCourse.subject2.trim()) {
                    courseText += " / " + nextCourse.subject2;
                }
                document.getElementById("arrive_subject").innerHTML = courseText;
                document.getElementById("count_down").innerHTML = "還有 " + minWaitTime + " min";
            }
        });

        if (!foundNext) {
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
